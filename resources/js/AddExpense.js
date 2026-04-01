// AddExpense.js
// Requires: jQuery, Select2, split_algo.js

$(document).ready(function () {

    // -- State 
    var participants = [];
    var participantsOptionsSelected = '';
    var participantsOptions = '';

    // -- Helpers 
    var avatarColors = ['av-0', 'av-1', 'av-2', 'av-3', 'av-4'];

    function avatarClass(name) {
        var idx = 0;
        for (var i = 0; i < name.length; i++) {
            idx += name.charCodeAt(i);
        }
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
        return '\u20B9' + num.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
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

        $lastRow.find('.payee').select2({
            minimumResultsForSearch: -1,
            dropdownParent: $('body')
        });

        $lastRow.find('.paidFor').select2({
            dropdownParent: $('body')
        });

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
    $(document).on('change keyup', '.amount-input', function () {
        updateSummaryBar();
    });

    function updateSummaryBar() {
        if (participants.length === 0) return;

        var totals = {};
        for (var k = 0; k < participants.length; k++) {
            totals[participants[k]] = 0;
        }

        $('#expenseTable tbody tr').each(function () {
            var payee  = $(this).find('.payee').val();
            var amount = parseFloat($(this).find('.amount-input').val()) || 0;
            if (payee && totals[payee] !== undefined) {
                totals[payee] += amount;
            }
        });

        var grand = 0;
        for (var p in totals) {
            grand += totals[p];
        }

        if (grand === 0) {
            $('#summaryBar').addClass('hidden');
            return;
        }

        var html = '';
        for (var i = 0; i < participants.length; i++) {
            var p = participants[i];
            if (totals[p] > 0) {
                html += '<span class="summary-chip">' +
                    '<span class="chip-name">' + p + '</span>' +
                    ' paid <span class="chip-amount">' + formatRs(totals[p]) + '</span>' +
                '</span>';
            }
        }
        html += '<span class="summary-chip" style="margin-left:auto;">' +
            'Total <span class="chip-amount">' + formatRs(grand) + '</span>' +
        '</span>';

        $('#summaryBar').html(html).removeClass('hidden');
    }

    // -- "Continue to Add Expenses" button 
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

        // Advance step indicators
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

    // -- Add new expense row 
    $(document).on('click', '.add-new', function () {
        newColumn();
    });

    // -- Reset / Start Over 
    $('#resetBtn').click(function () {
        if (confirm('Start over? All expenses will be cleared.')) {
            location.reload();
        }
    });

    // -- Calculate Settlement 
    $('#ExpenseReportButton').click(function () {

        // Advance steps
        $('#step2').removeClass('active').addClass('done');
        $('#step2 .step-num').html('<i class="fas fa-check" style="font-size:10px"></i>');
        $('#step3').addClass('active');

        // Build adjacency matrix
        var graph = [];
        for (var a = 0; a < participants.length; a++) {
            graph[a] = [];
            for (var b = 0; b < participants.length; b++) {
                graph[a][b] = 0;
            }
        }

        // Track how much each person actually spent (paid)
        var spent = {};
        for (var s = 0; s < participants.length; s++) {
            spent[participants[s]] = 0;
        }

        $('#expenseTable tbody tr').each(function () {
            var $row   = $(this);
            var payee  = $row.find('.payee').val();
            var amount = parseFloat($row.find('.amount-input').val()) || 0;
            // FIX: scope paidFor to this row only (was a global selector before)
            var paidFor = $row.find('.paidFor :selected').map(function (_, e) { return e.value; }).get();

            if (!payee || amount <= 0 || paidFor.length === 0) return;

            if (spent[payee] !== undefined) spent[payee] += amount;

            var share = amount / paidFor.length;
            for (var i = 0; i < paidFor.length; i++) {
                var person  = paidFor[i];
                var fromIdx = participants.indexOf(person);
                var toIdx   = participants.indexOf(payee);
                if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
                    graph[fromIdx][toIdx] += share;
                }
            }
        });

        // Run algorithm - returns array of { from, to, amount }
        var results = calculate(graph, participants);

        // -- Build report HTML 
        var html = '';

        // Per-person totals
        html += '<div class="section-label">Total Paid Per Person</div>';
        html += '<div class="totals-grid">';
        for (var t = 0; t < participants.length; t++) {
            var p = participants[t];
            html += '<div class="total-card">' +
                '<div class="tc-name">' + p + '</div>' +
                '<div class="tc-amount">' + formatRs(spent[p] || 0) + '</div>' +
            '</div>';
        }
        html += '</div>';

        // Settlement transactions
        html += '<div class="section-label" style="margin-top:20px">Who Pays Whom</div>';

        if (results.length === 0) {
            html += '<div class="no-debts">' +
                '<i class="fas fa-check-circle"></i>' +
                '<div style="font-size:1rem;color:var(--green);font-weight:600;">All settled!</div>' +
                '<div style="margin-top:4px;font-size:0.85rem;">Everyone\'s contributions are already balanced.</div>' +
            '</div>';
        } else {
            html += '<div class="settlement-list">';
            for (var r = 0; r < results.length; r++) {
                var s = results[r];
                var avFrom = avatarClass(s.from);
                var avTo   = avatarClass(s.to);
                var delay  = (r * 0.07) + 's';
                html += '<div class="settlement-item" style="animation-delay:' + delay + '">' +
                    '<div class="settlement-info">' +
                        '<div class="settlement-avatar ' + avFrom + '">' + initials(s.from) + '</div>' +
                        '<div class="settlement-text">' +
                            '<strong>' + s.from + '</strong>' +
                            '<i class="fas fa-arrow-right settlement-arrow"></i>' +
                            '<strong>' + s.to + '</strong>' +
                        '</div>' +
                    '</div>' +
                    '<div class="settlement-amount">' + formatRs(s.amount) + '</div>' +
                '</div>';
            }
            html += '</div>';
        }

        $('#ExpenseReportCardBody').html(html);
        $('#ExpenseReportCard').removeClass('hidden').hide().slideDown(600);
        $('html, body').animate({ scrollTop: $('#ExpenseReportCard').offset().top - 20 }, 600);
    });

});