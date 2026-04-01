// AddExpense.js
// Main orchestration file
// Requires: jQuery, Select2, split_algo.js
// Module dependencies: storage.js, utils.js, expenseTable.js, settlement.js, billManagement.js

// ============================================================
// STATE
// ============================================================
var participants = [];
var participantsOptionsSelected = '';
var participantsOptions = '';
var currentBillId = null;

// ============================================================
// SHARED SETUP FUNCTIONS (Global scope)
// ============================================================
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

function showAutosaveToast() {
    showToast('Auto-saved', 'green');
}

$(document).ready(function () {

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

    // ============================================================
    // RESET
    // ============================================================
    $('#resetBtn').click(function () {
        if (confirm('Start over? This will clear the current bill from view (saved bills are kept).')) {
            location.reload();
        }
    });

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

});