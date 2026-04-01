// AddExpense.js
// Requires: jQuery, Select2, split_algo.js

$(document).ready(function () {

    // -- State
    var participants = [];
    var participantsOptionsSelected = '';
    var participantsOptions = '';
    var currentBillId = null; // null = new bill, string = editing existing

    // -- Storage helpers (localStorage with graceful fallback)
    function storageGet(key) {
        try { return localStorage.getItem(key); } catch(e) { return null; }
    }
    function storageSet(key, val) {
        try { localStorage.setItem(key, val); } catch(e) {}
    }
    function storageRemove(key) {
        try { localStorage.removeItem(key); } catch(e) {}
    }

    function loadAllBills() {
        var raw = storageGet('billsplitter_bills');
        if (!raw) return [];
        try { return JSON.parse(raw); } catch(e) { return []; }
    }

    function saveAllBills(bills) {
        storageSet('billsplitter_bills', JSON.stringify(bills));
    }

    function genId() {
        return 'bill_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
    }

    // -- Avatar / formatting helpers
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

    // -- Select2: Members input
    $('#members').select2({
        placeholder: 'Type a name and press Enter\u2026',
        tags: true,
        allowClear: true,
        minimumResultsForSearch: -1,
        dropdownParent: $('body')
    });

    // -- Build a new expense row
    function newColumn() {
        var row = '<tr>' +
            '<td>' +
                '<select class="payee" style="width:100%">' + participantsOptions + '</select>' +
            '</td>' +
            '<td>' +
                '<input type="text" class="bs-input summary-input" placeholder="e.g. Dinner, Cab\u2026" />' +
            '</td>' +
            '<td>' +
                '<input type="number" class="bs-input amount-input" placeholder="0" min="0" step="0.01" />' +
            '</td>' +
            '<td>' +
                '<select class="paidFor" multiple style="width:100%">' + participantsOptionsSelected + '</select>' +
            '</td>' +
            '<td style="text-align:center">' +
                '<button type="button" class="delete-btn delete" title="Delete row"><i class="fas fa-trash-alt"></i></button>' +
            '</td>' +
        '</tr>';

        $('#expenseTable tbody').append(row);

        var $lastRow = $('#expenseTable tbody tr:last-child');

        $lastRow.find('.payee').select2({ minimumResultsForSearch: -1, dropdownParent: $('body') });
        $lastRow.find('.paidFor').select2({ dropdownParent: $('body') });
        $lastRow.find('.paidFor').on('select2:opening select2:closing', function () {
            $(this).parent().find('.select2-search__field').prop('disabled', true);
        });

        updateSummaryBar();
    }

    // -- Delete row
    $(document).on('click', '.delete', function () {
        $(this).closest('tr').remove();
        updateSummaryBar();
    });

    // -- Live summary bar
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
        for (var p in totals) { grand += totals[p]; }
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

    // -- "Continue to Expenses" button
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

        $('#step1').removeClass('active').addClass('done');
        $('#step1 .step-num').html('<i class="fas fa-check" style="font-size:10px"></i>');
        $('#step2').addClass('active');

        participantsOptionsSelected = '';
        participantsOptions = '';
        for (var i = 0; i < participants.length; i++) {
            var el = participants[i];
            participantsOptionsSelected += '<option selected value="' + el + '">' + el + '</option>';
            participantsOptions         += '<option value="' + el + '">' + el + '</option>';
        }

        $('#BillName').html(billName);
        $('#participants').html(participants.join(' \u00B7 '));
        $('#BillMetaCard').slideUp(600);
        $('#ExpenditureCard').removeClass('hidden').hide().slideDown(600);
        $('#AddExpenseButton').remove();
        newColumn();
    });

    // -- Add new row
    $(document).on('click', '.add-new', function () { newColumn(); });

    // -- Reset
    $('#resetBtn').click(function () {
        if (confirm('Start over? All unsaved expenses will be cleared.')) { location.reload(); }
    });

    // -- Collect current bill data from DOM
    function collectBillData() {
        var billName = $('#BillName').text().trim();
        var expenses = [];

        $('#expenseTable tbody tr').each(function () {
            var $row    = $(this);
            var payee   = $row.find('.payee').val();
            var desc    = $row.find('.summary-input').val();
            var amount  = parseFloat($row.find('.amount-input').val()) || 0;
            var paidFor = $row.find('.paidFor :selected').map(function (_, e) { return e.value; }).get();
            if (payee && amount > 0 && paidFor.length > 0) {
                expenses.push({ payee: payee, desc: desc, amount: amount, paidFor: paidFor });
            }
        });

        var total = 0;
        for (var i = 0; i < expenses.length; i++) { total += expenses[i].amount; }

        return {
            name:         billName,
            participants: participants.slice(),
            expenses:     expenses,
            total:        total
        };
    }

    // -- Run settlement algorithm and return results + spent map
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
            var exp     = data.expenses[e];
            var toIdx   = pts.indexOf(exp.payee);
            var share   = exp.amount / exp.paidFor.length;
            spent[exp.payee] = (spent[exp.payee] || 0) + exp.amount;
            for (var f = 0; f < exp.paidFor.length; f++) {
                var person  = exp.paidFor[f];
                var fromIdx = pts.indexOf(person);
                if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
                    graph[fromIdx][toIdx] += share;
                }
            }
        }

        var results = calculate(graph, pts);
        return { results: results, spent: spent };
    }

    // -- Build settlement HTML
    function buildSettlementHTML(data, results, spent) {
        var pts = data.participants;
        var html = '';

        html += '<div class="section-label">Total Paid Per Person</div>';
        html += '<div class="totals-grid">';
        for (var t = 0; t < pts.length; t++) {
            html += '<div class="total-card"><div class="tc-name">' + pts[t] + '</div><div class="tc-amount">' + formatRs(spent[pts[t]] || 0) + '</div></div>';
        }
        html += '</div>';
        html += '<div class="section-label" style="margin-top:20px">Who Pays Whom</div>';

        if (results.length === 0) {
            html += '<div class="no-debts"><i class="fas fa-check-circle"></i><div style="font-size:1rem;color:var(--green);font-weight:600;">All settled!</div><div style="margin-top:4px;font-size:0.85rem;">Everyone\'s contributions are already balanced.</div></div>';
        } else {
            html += '<div class="settlement-list">';
            for (var r = 0; r < results.length; r++) {
                var s = results[r];
                var avFrom = avatarClass(s.from);
                var delay  = (r * 0.07) + 's';
                html += '<div class="settlement-item" style="animation-delay:' + delay + '">' +
                    '<div class="settlement-info">' +
                        '<div class="settlement-avatar ' + avFrom + '">' + initials(s.from) + '</div>' +
                        '<div class="settlement-text"><strong>' + s.from + '</strong><i class="fas fa-arrow-right settlement-arrow"></i><strong>' + s.to + '</strong></div>' +
                    '</div>' +
                    '<div class="settlement-amount">' + formatRs(s.amount) + '</div>' +
                '</div>';
            }
            html += '</div>';
        }

        return html;
    }

    // -- Generate / refresh settlement
    $('#ExpenseReportButton').click(function () {
        $('#step2').removeClass('active').addClass('done');
        $('#step2 .step-num').html('<i class="fas fa-check" style="font-size:10px"></i>');
        $('#step3').addClass('active');

        var data      = collectBillData();
        var algo      = runSettlement(data);
        var html      = buildSettlementHTML(data, algo.results, algo.spent);

        $('#ExpenseReportCardBody').html(html);

        // Show save button in settlement header if not already there
        if ($('#saveBillBtn').length === 0) {
            $('#settlementCardHeader').append(
                '<button class="btn-save" id="saveBillBtn" type="button">' +
                '<i class="fas fa-save"></i> Save Bill</button>'
            );
        }

        if ($('#ExpenseReportCard').hasClass('hidden')) {
            $('#ExpenseReportCard').removeClass('hidden').hide().slideDown(600);
            $('html, body').animate({ scrollTop: $('#ExpenseReportCard').offset().top - 20 }, 600);
        }
        // If already visible, just update in place - no jump
    });

    // -- Save Bill
    $(document).on('click', '#saveBillBtn', function () {
        var data  = collectBillData();
        var algo  = runSettlement(data);

        if (data.expenses.length === 0) {
            alert('Please add at least one expense before saving.');
            return;
        }

        var bills = loadAllBills();

        if (currentBillId) {
            // Update existing entry
            for (var i = 0; i < bills.length; i++) {
                if (bills[i].id === currentBillId) {
                    bills[i].name         = data.name;
                    bills[i].participants = data.participants;
                    bills[i].expenses     = data.expenses;
                    bills[i].total        = data.total;
                    bills[i].settlements  = algo.results;
                    bills[i].updatedAt    = Date.now();
                    break;
                }
            }
        } else {
            // New entry
            currentBillId = genId();
            bills.push({
                id:           currentBillId,
                name:         data.name,
                participants: data.participants,
                expenses:     data.expenses,
                total:        data.total,
                settlements:  algo.results,
                createdAt:    Date.now(),
                updatedAt:    Date.now()
            });
        }

        saveAllBills(bills);
        renderSidebar();

        // Visual feedback
        var $btn = $('#saveBillBtn');
        $btn.html('<i class="fas fa-check"></i> Saved!').css('background', 'var(--green)');
        setTimeout(function () {
            $btn.html('<i class="fas fa-save"></i> Save Bill').css('background', '');
        }, 2000);
    });

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
            $list.html('<div class="sidebar-empty"><i class="fas fa-receipt"></i><p>No saved bills yet.<br>Generate a settlement and hit Save.</p></div>');
            return;
        }

        // Newest first
        var sorted = bills.slice().sort(function (a, b) { return b.updatedAt - a.updatedAt; });

        for (var i = 0; i < sorted.length; i++) {
            var bill = sorted[i];
            var isActive = bill.id === currentBillId;
            var total = formatRs(bill.total || 0);
            var date  = formatDate(bill.updatedAt || bill.createdAt);
            var pList = bill.participants ? bill.participants.join(', ') : '';

            var card = '<div class="sidebar-bill-card' + (isActive ? ' active' : '') + '" data-id="' + bill.id + '">' +
                '<div class="sbc-top">' +
                    '<div class="sbc-name">' + escapeHtml(bill.name) + '</div>' +
                    '<button class="sbc-delete" data-id="' + bill.id + '" title="Delete bill"><i class="fas fa-trash-alt"></i></button>' +
                '</div>' +
                '<div class="sbc-meta">' +
                    '<span><i class="fas fa-users"></i> ' + (bill.participants ? bill.participants.length : 0) + ' people</span>' +
                    '<span><i class="fas fa-calendar-alt"></i> ' + date + '</span>' +
                '</div>' +
                '<div class="sbc-participants">' + escapeHtml(pList) + '</div>' +
                '<div class="sbc-footer">' +
                    '<span class="sbc-total">' + total + '</span>' +
                    '<span class="sbc-settlements">' + (bill.settlements ? bill.settlements.length : 0) + ' transaction' + (bill.settlements && bill.settlements.length !== 1 ? 's' : '') + '</span>' +
                '</div>' +
            '</div>';

            $list.append(card);
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // -- Delete from sidebar
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

    // -- Load bill from sidebar into view (read-only settlement view)
    $(document).on('click', '.sidebar-bill-card', function (e) {
        if ($(e.target).closest('.sbc-delete').length) return;
        var id    = $(this).data('id');
        var bills = loadAllBills();
        var bill  = null;
        for (var i = 0; i < bills.length; i++) {
            if (bills[i].id === id) { bill = bills[i]; break; }
        }
        if (!bill) return;

        // Show settlement inline in a modal-style overlay
        showBillPreview(bill);
    });

    function showBillPreview(bill) {
        var algo = runSettlement(bill);
        var html = buildSettlementHTML(bill, algo.results, algo.spent);

        var date = formatDate(bill.updatedAt || bill.createdAt);
        var modal = '<div id="billPreviewModal">' +
            '<div id="billPreviewBox">' +
                '<div id="billPreviewHeader">' +
                    '<div>' +
                        '<div style="font-family:\'Syne\',sans-serif;font-size:1.1rem;font-weight:800;">' + escapeHtml(bill.name) + '</div>' +
                        '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">' + escapeHtml(bill.participants.join(' \u00B7 ')) + ' &bull; ' + date + '</div>' +
                    '</div>' +
                    '<button id="billPreviewClose" type="button"><i class="fas fa-times"></i></button>' +
                '</div>' +
                '<div id="billPreviewBody">' + html + '</div>' +
            '</div>' +
        '</div>';

        $('body').append(modal);

        $('#billPreviewClose, #billPreviewModal').click(function (e) {
            if (e.target.id === 'billPreviewModal' || e.target.id === 'billPreviewClose' || $(e.target).closest('#billPreviewClose').length) {
                $('#billPreviewModal').remove();
            }
        });
        $('#billPreviewBox').click(function(e) { e.stopPropagation(); });
    }

});