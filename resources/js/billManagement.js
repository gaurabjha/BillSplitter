// billManagement.js
// Bill management, sidebar, import/export functionality
// Requires: storage.js, utils.js, settlement.js

var $overlay;
var $sidebar;

// ============================================================
// SIDEBAR FUNCTIONS (Global scope)
// ============================================================
function openSidebar() {
    renderSidebar();
    $sidebar.addClass('open');
    $overlay.addClass('open');
    $('body').css('overflow', 'hidden');
}

function closeSidebar() {
    $sidebar.removeClass('open');
    $overlay.removeClass('open');
    $('body').css('overflow', '');
}

function renderSidebar() {
    var bills = loadAllBills();
    var $list = $('#sidebarList');
    $list.empty();

    if (bills.length === 0) {
        $list.html('<div class="sidebar-empty"><i class="fas fa-receipt"></i><p>No saved bills yet.<br>Generate a settlement to auto-save.</p></div>');
        return;
    }

    var sorted = bills.slice().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });

    for (var i = 0; i < sorted.length; i++) {
        var bill = sorted[i];
        var isActive = bill.id === currentBillId;
        var date = formatDate(bill.updatedAt || bill.createdAt);
        var pList = bill.participants ? bill.participants.join(', ') : '';
        var txCount = bill.settlements ? bill.settlements.length : 0;

        $list.append(
            '<div class="sidebar-bill-card' + (isActive ? ' active' : '') + '" data-id="' + bill.id + '">' +
            '<div class="sbc-top">' +
            '<div class="sbc-name">' + escapeHtml(bill.name) + '</div>' +
            '<div style="display:flex;gap:4px;flex-shrink:0;">' +
            '<button class="sbc-export" data-id="' + bill.id + '" title="Export this bill"><i class="fas fa-download"></i></button>' +
            '<button class="sbc-delete" data-id="' + bill.id + '" title="Delete bill"><i class="fas fa-trash-alt"></i></button>' +
            '</div>' +
            '</div>' +
            '<div class="sbc-id"><i class="fas fa-fingerprint"></i> ' + bill.id + '</div>' +
            '<div class="sbc-meta">' +
            '<span><i class="fas fa-users"></i> ' + (bill.participants ? bill.participants.length : 0) + ' people</span>' +
            '<span><i class="fas fa-calendar-alt"></i> ' + date + '</span>' +
            '</div>' +
            '<div class="sbc-participants">' + escapeHtml(pList) + '</div>' +
            '<div class="sbc-footer">' +
            '<span class="sbc-total">' + formatRs(bill.total || 0) + '</span>' +
            '<span class="sbc-settlements">' + txCount + ' transaction' + (txCount !== 1 ? 's' : '') + '</span>' +
            '</div>' +
            '</div>'
        );
    }
}

function loadBillIntoPage(bill) {
    // 1. Reset meta card with bill name + participants pre-filled
    $('#BillMetaCard').show();
    $('#meta-bill-name').val(bill.name);

    // Re-init Select2 members with saved participants
    $('#members').val(null).trigger('change'); // clear first
    for (var i = 0; i < bill.participants.length; i++) {
        var opt = new Option(bill.participants[i], bill.participants[i], true, true);
        $('#members').append(opt);
    }
    $('#members').trigger('change');

    // 2. Activate expense phase (restores table rows too)
    activateExpensePhase(bill.name, bill.participants, bill.expenses);

    // 3. Re-run settlement so it's immediately visible
    var algo = runSettlement(bill);
    var html = buildSettlementHTML(bill, algo.results, algo.spent);
    $('#ExpenseReportCardBody').html(html);
    $('#ExpenseReportCard').removeClass('hidden').show();

    // Mark all steps done
    $('#step2').removeClass('active').addClass('done');
    $('#step2 .step-num').html('<i class="fas fa-check" style="font-size:10px"></i>');
    $('#step3').removeClass('active').addClass('done');
    $('#step3 .step-num').html('<i class="fas fa-check" style="font-size:10px"></i>');

    // Scroll to top
    $('html, body').animate({ scrollTop: 0 }, 400);
    renderSidebar();
}

// ============================================================
// EXPORT / IMPORT FUNCTIONS (Global scope)
// ============================================================
function exportBillAsJSON(bill) {
    var payload = JSON.stringify(bill, null, 2);
    var blob = new Blob([payload], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var safeName = (bill.name || 'bill').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    a.href = url;
    a.download = 'billsplitter_' + safeName + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importParsed(parsed) {
    // Accept either a single bill object or an { bills: [...] } bundle
    var toImport = [];

    if (parsed.bills && parsed.bills.length) {
        // Multi-bill export bundle
        toImport = parsed.bills;
    } else if (parsed.id && parsed.name && parsed.participants) {
        // Single bill
        toImport = [parsed];
    } else {
        alert('Unrecognised format. Please import a file exported from BillSplitter.');
        return;
    }

    var existing = loadAllBills();
    var added = 0, updated = 0;

    for (var i = 0; i < toImport.length; i++) {
        var incoming = toImport[i];
        // Validate minimum fields
        if (!incoming.name || !incoming.participants || !incoming.expenses) continue;

        // Ensure it has an ID
        if (!incoming.id) incoming.id = makeBillId(incoming.name);

        var found = false;
        for (var j = 0; j < existing.length; j++) {
            if (existing[j].id === incoming.id) {
                // Overwrite with imported version
                existing[j] = incoming;
                existing[j].updatedAt = Date.now();
                updated++;
                found = true;
                break;
            }
        }
        if (!found) {
            incoming.createdAt = incoming.createdAt || Date.now();
            incoming.updatedAt = Date.now();
            existing.push(incoming);
            added++;
        }
    }

    saveAllBills(existing);
    renderSidebar();
    closeSidebar();
    openSidebar();

    var msg = '';
    if (added > 0) msg += added + ' bill' + (added !== 1 ? 's' : '') + ' imported. ';
    if (updated > 0) msg += updated + ' bill' + (updated !== 1 ? 's' : '') + ' updated.';
    showToast(msg.trim() || 'Nothing to import.', 'green');

    // If only one bill imported, load it directly
    if (toImport.length === 1 && (toImport[0].name && toImport[0].participants)) {
        var bill = toImport[0];
        bill.id = makeBillId(bill.name);
        setTimeout(function () { loadBillIntoPage(bill); }, 300);
    }
}

// ============================================================
// EVENT HANDLERS (Document ready)
// ============================================================
$(document).ready(function () {

    $overlay = $('#sidebarOverlay');
    $sidebar = $('#historySidebar');

    // Sidebar handlers
    $('#historyBtn').click(function () { openSidebar(); });
    $overlay.click(function () { closeSidebar(); });
    $('#sidebarClose').click(function () { closeSidebar(); });

    // Delete bill
    $(document).on('click', '.sbc-delete', function (e) {
        e.stopPropagation();
        var id = $(this).data('id');
        if (!confirm('Delete this saved bill?')) return;
        var bills = loadAllBills();
        var filtered = [];
        for (var i = 0; i < bills.length; i++) {
            if (bills[i].id !== id) filtered.push(bills[i]);
        }
        saveAllBills(filtered);
        if (currentBillId === id) { currentBillId = null; }
        renderSidebar();
    });

    // Load bill from sidebar
    $(document).on('click', '.sidebar-bill-card', function (e) {
        if ($(e.target).closest('.sbc-delete').length) return;

        var id = $(this).data('id');
        var bills = loadAllBills();
        var bill = null;
        for (var i = 0; i < bills.length; i++) {
            if (bills[i].id === id) { bill = bills[i]; break; }
        }
        if (!bill) return;

        closeSidebar();
        loadBillIntoPage(bill);
    });

    // Export all saved bills as a single JSON file
    $('#exportAllBtn').click(function () {
        var bills = loadAllBills();
        if (bills.length === 0) { alert('No saved bills to export.'); return; }
        var payload = JSON.stringify({ version: 1, exported: Date.now(), bills: bills }, null, 2);
        var blob = new Blob([payload], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'billsplitter_all_' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Exported ' + bills.length + ' bill' + (bills.length !== 1 ? 's' : ''), 'green');
    });

    // Export current (active) bill
    $('#exportCurrentBtn').click(function () {
        var data = collectBillData();
        if (!currentBillId || data.expenses.length === 0) {
            alert('Generate a settlement first before exporting.');
            return;
        }
        var bills = loadAllBills();
        var bill = null;
        for (var i = 0; i < bills.length; i++) {
            if (bills[i].id === currentBillId) { bill = bills[i]; break; }
        }
        if (!bill) {
            // Hasn't been saved yet - build it on the fly
            var algo = runSettlement(data);
            bill = {
                id: currentBillId, name: data.name, participants: data.participants,
                expenses: data.expenses, total: data.total, settlements: algo.results,
                createdAt: Date.now(), updatedAt: Date.now()
            };
        }
        exportBillAsJSON(bill);
        showToast('Bill exported', 'green');
    });

    // Share: copy a plain-text settlement summary to clipboard
    $('#shareCurrentBtn').click(function () {
        var data = collectBillData();
        if (data.expenses.length === 0) { alert('No expenses to share yet.'); return; }
        var algo = runSettlement(data);
        var lines = [];
        lines.push('=== ' + data.name + ' ===');
        lines.push('Participants: ' + data.participants.join(', '));
        lines.push('');
        lines.push('Expenses:');
        for (var e = 0; e < data.expenses.length; e++) {
            var exp = data.expenses[e];
            lines.push('  ' + (exp.desc || 'Expense') + ' - ' + formatRs(exp.amount) + ' paid by ' + exp.payee + ' (shared by ' + exp.paidFor.join(', ') + ')');
        }
        lines.push('');
        lines.push('Settlement:');
        if (algo.results.length === 0) {
            lines.push('  All settled! No payments needed.');
        } else {
            for (var r = 0; r < algo.results.length; r++) {
                var s = algo.results[r];
                lines.push('  ' + s.from + ' pays ' + formatRs(s.amount) + ' to ' + s.to);
            }
        }
        var text = lines.join('\n');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                showToast('Copied to clipboard!', 'accent');
            }, function () {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    });

    // Per-bill export from sidebar
    $(document).on('click', '.sbc-export', function (e) {
        e.stopPropagation();
        var id = $(this).data('id');
        var bills = loadAllBills();
        for (var i = 0; i < bills.length; i++) {
            if (bills[i].id === id) { exportBillAsJSON(bills[i]); break; }
        }
        showToast('Bill exported', 'green');
    });

    // Import: open file picker
    $('#importBillBtn, #importLink').click(function (e) {
        e.preventDefault();
        $('#importFileInput').val('').click();
    });

    $('#importFileInput').on('change', function () {
        var file = this.files && this.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
            try {
                var parsed = JSON.parse(ev.target.result);
                importParsed(parsed);
            } catch (err) {
                alert('Could not read the file. Make sure it is a valid BillSplitter JSON export.');
            }
        };
        reader.readAsText(file);
    });

}); // End of $(document).ready()
