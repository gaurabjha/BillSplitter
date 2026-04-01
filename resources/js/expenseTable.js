// expenseTable.js
// Expense table row management and updates

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

// Initialize event handlers for expense table rows
$(document).on('click', '.delete', function () {
    $(this).closest('tr').remove();
    updateSummaryBar();
});

$(document).on('change keyup', '.amount-input', function () { updateSummaryBar(); });

$(document).on('click', '.add-new', function () { newColumn(); });
