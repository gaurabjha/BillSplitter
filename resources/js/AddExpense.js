// AddExpense.js
// Requires: jQuery, Select2, split_algo.js

$(document).ready(function () {

    // ============================================================
    // STATE
    // ============================================================
    var participants = [];
    var participantsOptionsSelected = '';
    var participantsOptions = '';
    var currentBillId = null;

    // ============================================================
    // STORAGE
    // ============================================================
    function storageGet(key) {
        try { return localStorage.getItem(key); } catch(e) { return null; }
    }
    function storageSet(key, val) {
        try { localStorage.setItem(key, val); } catch(e) {}
    }

    function loadAllBills() {
        var raw = storageGet('billsplitter_bills');
        if (!raw) return [];
        try { return JSON.parse(raw); } catch(e) { return []; }
    }

    function saveAllBills(bills) {
        storageSet('billsplitter_bills', JSON.stringify(bills));
    }

    // Bill ID is derived from the bill name (slug) so same-named bills always overwrite
    function makeBillId(name) {
        return 'bill__' + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    }

    // ============================================================
    // HELPERS
    // ============================================================
    var avatarColors = ['av-0', 'av-1', 'av-2', 'av-3', 'av-4'];

    function avatarClass(name) {
        var idx = 0;
        for (var i = 0; i < name.length; i++) { idx += name.charCodeAt(i); }
        return avatarColors[idx % avatarColors.length];
    }

    function initials(name) {
        var parts = name.trim().split(' ');
        var result = '';
        for (var i = 0; i < Math.min(parts.length, 2); i++) {
            if (parts[i].length > 0) result += parts[i][0].toUpperCase();
        }
        return result;
    }

    function formatRs(n) {
        var num = parseFloat(n) || 0;
        return '\u20B9' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    function formatDate(ts) {
        var d = new Date(ts);
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ============================================================
    // MEMBERS SELECT2
    // ============================================================
    $('#members').select2({
        placeholder: 'Type a name and press Enter\u2026',
        tags: true,
        allowClear: true,
        minimumResultsForSearch: -1,
        dropdownParent: $('body')
    });

    // ============================================================
    // EXPENSE TABLE ROWS
    // ============================================================
    function newColumn(data) {
        // data is optional: { payee, desc, amount, paidFor[] } for restoring saved rows
        var row = '<tr>' +
            '<td><select class="payee" style="width:100%">' + participantsOptions + '</select></td>' +
            '<td><input type="text" class="bs-input summary-input" placeholder="e.g. Dinner, Cab\u2026" /></td>' +
            '<td><input type="number" class="bs-input amount-input" placeholder="0" min="0" step="0.01" /></td>' +
            '<td><select class="paidFor" multiple style="width:100%">' + participantsOptionsSelected + '</select></td>' +
            '<td style="text-align:center"><button type="button" class="delete-btn delete" title="Delete row"><i class="fas fa-trash-alt"></i></button></td>' +
        '</tr>';

        $('#expenseTable tbody').append(row);
        var $row = $('#expenseTable tbody tr:last-child');

        $row.find('.payee').select2({ minimumResultsForSearch: -1, dropdownParent: $('body') });
        $row.find('.paidFor').select2({ dropdownParent: $('body') });
        $row.find('.paidFor').on('select2:opening select2:closing', function () {
            $(this).parent().find('.select2-search__field').prop('disabled', true);
        });

        // Restore saved data into this row
        if (data) {
            $row.find('.payee').val(data.payee).trigger('change');
            $row.find('.summary-input').val(data.desc || '');
            $row.find('.amount-input').val(data.amount || '');
            if (data.paidFor && data.paidFor.length) {
                $row.find('.paidFor').val(data.paidFor).trigger('change');
            }
        }

        updateSummaryBar();
    }

    $(document).on('click', '.delete', function () {
        $(this).closest('tr').remove();
        updateSummaryBar();
    });

    $(document).on('change keyup', '.amount-input', function () { updateSummaryBar(); });

    function updateSummaryBar() {
        if (participants.length === 0) return;
        var totals = {};
        for (var k = 0; k < participants.length; k++) { totals[participants[k]] = 0; }
        $('#expenseTable tbody tr').each(function () {
            var payee  = $(this).find('.payee').val();
            var amount = parseFloat($(this).find('.amount-input').val()) || 0;
            if (payee && totals[payee] !== undefined) totals[payee] += amount;
        });
        var grand = 0;
        for (var gp in totals) { grand += totals[gp]; }
        if (grand === 0) { $('#summaryBar').addClass('hidden'); return; }
        var html = '';
        for (var i = 0; i < participants.length; i++) {
            var pm = participants[i];
            if (totals[pm] > 0) {
                html += '<span class="summary-chip"><span class="chip-name">' + pm + '</span> paid <span class="chip-amount">' + formatRs(totals[pm]) + '</span></span>';
            }
        }
        html += '<span class="summary-chip" style="margin-left:auto;">Total <span class="chip-amount">' + formatRs(grand) + '</span></span>';
        $('#summaryBar').html(html).removeClass('hidden');
    }

    // ============================================================
    // STEP 1 -> STEP 2  (Continue button)
    // ============================================================
    $('#AddExpenseButton').click(function () {
        var billName = $('#meta-bill-name').val().trim();
        participants = $('#members :selected').map(function (_, e) { return e.value; }).get();

        if (!billName) {
            $('#meta-bill-name').css('border-color', 'var(--red)').focus();
            setTimeout(function () { $('#meta-bill-name').css('border-color', ''); }, 1500);
            return;
        }
        if (participants.length < 2) {
            alert('Please add at least 2 members to split the bill.');
            return;
        }

        activateExpensePhase(billName, participants, null);
    });

    // Shared setup for both "Continue" and "Load from sidebar"
    function activateExpensePhase(billName, pts, existingExpenses) {
        participants = pts.slice();
        participantsOptionsSelected = '';
        participantsOptions = '';
        for (var i = 0; i < participants.length; i++) {
            var el = participants[i];
            participantsOptionsSelected += '<option selected value="' + el + '">' + el + '</option>';
            participantsOptions         += '<option value="' + el + '">' + el + '</option>';
        }

        currentBillId = makeBillId(billName);

        // Update header
        $('#BillName').html(escapeHtml(billName));
        $('#participants').html(escapeHtml(participants.join(' \u00B7 ')));

        // Show bill ID badge in card header
        updateBillIdBadge();

        // Steps
        $('#step1').removeClass('active').addClass('done');
        $('#step1 .step-num').html('<i class="fas fa-check" style="font-size:10px"></i>');
        $('#step2').addClass('active');
        $('#step3').removeClass('active done');
        $('#step3 .step-num').html('3');

        // Show expense card
        $('#BillMetaCard').slideUp(600);
        $('#ExpenditureCard').removeClass('hidden').hide().slideDown(600);
        $('#AddExpenseButton').remove();

        // Clear and repopulate table
        $('#expenseTable tbody').empty();
        $('#ExpenseReportCard').addClass('hidden');
        $('#ExpenseReportCardBody').empty();

        if (existingExpenses && existingExpenses.length > 0) {
            for (var j = 0; j < existingExpenses.length; j++) {
                newColumn(existingExpenses[j]);
            }
        } else {
            newColumn();
        }

        updateSummaryBar();
    }

    function updateBillIdBadge() {
        $('#billIdBadge').remove();
        if (currentBillId) {
            var displayId = currentBillId.replace('bill__', '').replace(/_/g, ' ');
            $('#ExpenditureCard .bs-card-header').append(
                '<span id="billIdBadge" title="Bill ID: ' + currentBillId + '">' +
                '<i class="fas fa-fingerprint"></i> ' + escapeHtml(displayId) +
                '</span>'
            );
        }
    }

    // ============================================================
    // ADD ROW / RESET
    // ============================================================
    $(document).on('click', '.add-new', function () { newColumn(); });

    $('#resetBtn').click(function () {
        if (confirm('Start over? This will clear the current bill from view (saved bills are kept).')) {
            location.reload();
        }
    });

    // ============================================================
    // COLLECT BILL DATA FROM DOM
    // ============================================================
    function collectBillData() {
        var billName = $('#BillName').text().trim();
        var expenses = [];

        $('#expenseTable tbody tr').each(function () {
            var $r      = $(this);
            var payee   = $r.find('.payee').val();
            var desc    = $r.find('.summary-input').val();
            var amount  = parseFloat($r.find('.amount-input').val()) || 0;
            var paidFor = $r.find('.paidFor :selected').map(function (_, e) { return e.value; }).get();
            if (payee && amount > 0 && paidFor.length > 0) {
                expenses.push({ payee: payee, desc: desc, amount: amount, paidFor: paidFor });
            }
        });

        var total = 0;
        for (var i = 0; i < expenses.length; i++) { total += expenses[i].amount; }

        return { name: billName, participants: participants.slice(), expenses: expenses, total: total };
    }

    // ============================================================
    // RUN ALGORITHM
    // ============================================================
    function runSettlement(data) {
        var pts = data.participants;
        var graph = [];
        var spent = {};
        for (var a = 0; a < pts.length; a++) {
            graph[a] = [];
            for (var b = 0; b < pts.length; b++) { graph[a][b] = 0; }
            spent[pts[a]] = 0;
        }
        for (var e = 0; e < data.expenses.length; e++) {
            var exp   = data.expenses[e];
            var toIdx = pts.indexOf(exp.payee);
            var share = exp.amount / exp.paidFor.length;
            spent[exp.payee] = (spent[exp.payee] || 0) + exp.amount;
            for (var f = 0; f < exp.paidFor.length; f++) {
                var fromIdx = pts.indexOf(exp.paidFor[f]);
                if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
                    graph[fromIdx][toIdx] += share;
                }
            }
        }
        return { results: calculate(graph, pts), spent: spent };
    }

    // ============================================================
    // BUILD SETTLEMENT HTML
    // ============================================================
    function buildSettlementHTML(data, results, spent) {
        var pts  = data.participants;
        var html = '';

        html += '<div class="section-label">Total Paid Per Person</div><div class="totals-grid">';
        for (var t = 0; t < pts.length; t++) {
            html += '<div class="total-card"><div class="tc-name">' + escapeHtml(pts[t]) + '</div><div class="tc-amount">' + formatRs(spent[pts[t]] || 0) + '</div></div>';
        }
        html += '</div>';
        html += '<div class="section-label" style="margin-top:20px">Who Pays Whom</div>';

        if (results.length === 0) {
            html += '<div class="no-debts"><i class="fas fa-check-circle"></i><div style="font-size:1rem;color:var(--green);font-weight:600;">All settled!</div><div style="margin-top:4px;font-size:0.85rem;">Everyone\'s contributions are already balanced.</div></div>';
        } else {
            html += '<div class="settlement-list">';
            for (var r = 0; r < results.length; r++) {
                var s     = results[r];
                var delay = (r * 0.07) + 's';
                html += '<div class="settlement-item" style="animation-delay:' + delay + '">' +
                    '<div class="settlement-info">' +
                        '<div class="settlement-avatar ' + avatarClass(s.from) + '">' + initials(s.from) + '</div>' +
                        '<div class="settlement-text"><strong>' + escapeHtml(s.from) + '</strong><i class="fas fa-arrow-right settlement-arrow"></i><strong>' + escapeHtml(s.to) + '</strong></div>' +
                    '</div>' +
                    '<div class="settlement-amount">' + formatRs(s.amount) + '</div>' +
                '</div>';
            }
            html += '</div>';
        }
        return html;
    }

    // ============================================================
    // PERSIST BILL (auto-save by name-based ID)
    // ============================================================
    function persistBill(data, algo) {
        var id    = makeBillId(data.name);
        var bills = loadAllBills();
        var found = false;

        for (var i = 0; i < bills.length; i++) {
            if (bills[i].id === id) {
                bills[i].name         = data.name;
                bills[i].participants = data.participants;
                bills[i].expenses     = data.expenses;
                bills[i].total        = data.total;
                bills[i].settlements  = algo.results;
                bills[i].updatedAt    = Date.now();
                found = true;
                break;
            }
        }
        if (!found) {
            bills.push({
                id:           id,
                name:         data.name,
                participants: data.participants,
                expenses:     data.expenses,
                total:        data.total,
                settlements:  algo.results,
                createdAt:    Date.now(),
                updatedAt:    Date.now()
            });
        }

        currentBillId = id;
        saveAllBills(bills);
        renderSidebar();
    }

    // ============================================================
    // GENERATE SETTLEMENT  (auto-saves)
    // ============================================================
    $('#ExpenseReportButton').click(function () {
        var data = collectBillData();

        if (data.expenses.length === 0) {
            alert('Please add at least one expense first.');
            return;
        }

        var algo = runSettlement(data);
        var html = buildSettlementHTML(data, algo.results, algo.spent);

        // Auto-save
        persistBill(data, algo);

        // Mark steps
        $('#step2').removeClass('active').addClass('done');
        $('#step2 .step-num').html('<i class="fas fa-check" style="font-size:10px"></i>');
        $('#step3').addClass('active');

        // Flash autosave indicator
        showAutosaveToast();

        // Render settlement
        $('#ExpenseReportCardBody').html(html);
        if ($('#ExpenseReportCard').hasClass('hidden')) {
            $('#ExpenseReportCard').removeClass('hidden').hide().slideDown(500);
            $('html, body').animate({ scrollTop: $('#ExpenseReportCard').offset().top - 20 }, 500);
        }
        // Already visible: just update content in place, no scroll jump
    });

    function showAutosaveToast() {
        showToast('Auto-saved', 'green');
    }

    // ============================================================
    // SIDEBAR
    // ============================================================
    var $overlay = $('#sidebarOverlay');
    var $sidebar = $('#historySidebar');

    $('#historyBtn').click(function () { openSidebar(); });
    $overlay.click(function () { closeSidebar(); });
    $('#sidebarClose').click(function () { closeSidebar(); });

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
            var bill     = sorted[i];
            var isActive = bill.id === currentBillId;
            var date     = formatDate(bill.updatedAt || bill.createdAt);
            var pList    = bill.participants ? bill.participants.join(', ') : '';
            var txCount  = bill.settlements ? bill.settlements.length : 0;

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

    // Delete
    $(document).on('click', '.sbc-delete', function (e) {
        e.stopPropagation();
        var id = $(this).data('id');
        if (!confirm('Delete this saved bill?')) return;
        var bills    = loadAllBills();
        var filtered = [];
        for (var i = 0; i < bills.length; i++) {
            if (bills[i].id !== id) filtered.push(bills[i]);
        }
        saveAllBills(filtered);
        if (currentBillId === id) { currentBillId = null; }
        renderSidebar();
    });

    // ============================================================
    // LOAD BILL INTO MAIN PAGE FOR EDITING
    // ============================================================
    $(document).on('click', '.sidebar-bill-card', function (e) {
        if ($(e.target).closest('.sbc-delete').length) return;

        var id    = $(this).data('id');
        var bills = loadAllBills();
        var bill  = null;
        for (var i = 0; i < bills.length; i++) {
            if (bills[i].id === id) { bill = bills[i]; break; }
        }
        if (!bill) return;

        closeSidebar();
        loadBillIntoPage(bill);
    });

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
    // EXPORT / IMPORT
    // ============================================================

    // -- Download a single bill as JSON
    function exportBillAsJSON(bill) {
        var payload = JSON.stringify(bill, null, 2);
        var blob    = new Blob([payload], { type: 'application/json' });
        var url     = URL.createObjectURL(blob);
        var a       = document.createElement('a');
        var safeName = (bill.name || 'bill').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
        a.href     = url;
        a.download = 'billsplitter_' + safeName + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // -- Export all saved bills as a single JSON file
    $('#exportAllBtn').click(function () {
        var bills = loadAllBills();
        if (bills.length === 0) { alert('No saved bills to export.'); return; }
        var payload = JSON.stringify({ version: 1, exported: Date.now(), bills: bills }, null, 2);
        var blob    = new Blob([payload], { type: 'application/json' });
        var url     = URL.createObjectURL(blob);
        var a       = document.createElement('a');
        a.href      = url;
        a.download  = 'billsplitter_all_' + new Date().toISOString().slice(0,10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Exported ' + bills.length + ' bill' + (bills.length !== 1 ? 's' : ''), 'green');
    });

    // -- Export current (active) bill
    $('#exportCurrentBtn').click(function () {
        var data = collectBillData();
        if (!currentBillId || data.expenses.length === 0) {
            alert('Generate a settlement first before exporting.');
            return;
        }
        var bills = loadAllBills();
        var bill  = null;
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

    // -- Share: copy a plain-text settlement summary to clipboard
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

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity  = '0';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try { document.execCommand('copy'); showToast('Copied to clipboard!', 'accent'); } catch(e) { alert(text); }
        document.body.removeChild(ta);
    }

    // -- Per-bill export from sidebar
    $(document).on('click', '.sbc-export', function (e) {
        e.stopPropagation();
        var id    = $(this).data('id');
        var bills = loadAllBills();
        for (var i = 0; i < bills.length; i++) {
            if (bills[i].id === id) { exportBillAsJSON(bills[i]); break; }
        }
        showToast('Bill exported', 'green');
    });

    // -- Import: open file picker
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
            } catch(err) {
                alert('Could not read the file. Make sure it is a valid BillSplitter JSON export.');
            }
        };
        reader.readAsText(file);
    });

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
        if (added > 0)   msg += added + ' bill' + (added !== 1 ? 's' : '') + ' imported. ';
        if (updated > 0) msg += updated + ' bill' + (updated !== 1 ? 's' : '') + ' updated.';
        showToast(msg.trim() || 'Nothing to import.', 'green');

        // If only one bill imported, load it directly
        if (toImport.length === 1 && (toImport[0].name && toImport[0].participants)) {
            var bill = toImport[0];
            bill.id = makeBillId(bill.name);
            setTimeout(function () { loadBillIntoPage(bill); }, 300);
        }
    }

    // -- Shared toast (replaces showAutosaveToast, generalised)
    function showToast(msg, type) {
        $('#autosaveToast').remove();
        var bg = type === 'accent' ? 'var(--accent)' : 'var(--green)';
        var icon = type === 'accent' ? 'fa-clipboard-check' : 'fa-check-circle';
        $('body').append(
            '<div id="autosaveToast" style="background:' + bg + '">' +
            '<i class="fas ' + icon + '"></i> ' + msg + '</div>'
        );
        setTimeout(function () { $('#autosaveToast').addClass('fade-out'); }, 1800);
        setTimeout(function () { $('#autosaveToast').remove(); }, 2300);
    }


});