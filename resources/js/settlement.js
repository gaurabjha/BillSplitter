// settlement.js
// Settlement calculation and HTML rendering
// Requires: split_algo.js, utils.js

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
