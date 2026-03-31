
// Cash flow algorithm for minimum settlement of debts
// Algorithm: Find minimum cash flow among a set of persons

var N = 0;
var nameArray = [];

// A utility function that returns index of minimum value in arr
function getMin(arr) {
    var minInd = 0;
    for (i = 1; i < N; i++)
        if (arr[i] < arr[minInd])
            minInd = i;
    return minInd;
}

// A utility function that returns index of maximum value in arr
function getMax(arr) {
    var maxInd = 0;
    for (i = 1; i < N; i++)
        if (arr[i] > arr[maxInd])
            maxInd = i;
    return maxInd;
}

// A utility function to return minimum of 2 values
function minOf2(x, y) {
    return (x < y) ? x : y;
}

// Format currency with commas and decimals
function formatCurrency(amount) {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// amount[p] indicates the net amount to be credited/debited to/from person 'p'
// If amount[p] is positive, then person will receive amount[p]
// If amount[p] is negative, then person will give -amount[p]
function minCashFlowRec(amount) {
    // Find the indexes of minimum and maximum values in amount
    var mxCredit = getMax(amount), mxDebit = getMin(amount);

    // If both amounts are 0, all amounts are settled
    if (amount[mxCredit] == 0 && amount[mxDebit] == 0)
        return;

    // Find the minimum of two amounts
    var min = minOf2(-amount[mxDebit], amount[mxCredit]);
    amount[mxCredit] -= min;
    amount[mxDebit] += min;

    // Display the settlement
    var settlementHTML = '<div class="expense-report-item">' +
        '<i class="fas fa-exchange-alt me-2" style="color: #6366f1;"></i>' +
        '<strong>' + nameArray[mxDebit] + '</strong> pays <strong>₹' + formatCurrency(min) +
        '</strong> to <strong>' + nameArray[mxCredit] + '</strong>' +
        '</div>';

    $("#ExpenseReportCardBody").append(settlementHTML);

    // Recursively process remaining amounts
    minCashFlowRec(amount);
}

// Main calculate function
// graph[i][j] indicates the amount that person i needs to pay person j
function calculate(graph, names) {
    N = graph.length;
    nameArray = names;

    // Create an array amount, initialize all values as 0
    var amount = Array.from({ length: N }, (_, i) => 0);

    // Calculate the net amount to be paid to person 'p'
    // amount[p] = sum of what others owe to p - sum of what p owes to others
    for (p = 0; p < N; p++) {
        for (i = 0; i < N; i++) {
            amount[p] += (graph[i][p] - graph[p][i]);
        }
    }

    // Calculate total expenses
    var totalExpense = 0;
    for (p = 0; p < N; p++) {
        for (i = 0; i < N; i++) {
            totalExpense += graph[p][i];
        }
    }
    totalExpense = totalExpense / N; // Average

    // Display summary
    var summaryHTML = '<div class="expense-summary">' +
        '<h3><i class="fas fa-chart-pie me-2"></i>Expense Settlements</h3>' +
        '</div>';
    $("#ExpenseReportCardBody").append(summaryHTML);

    // Display individual expense shares
    var shareHTML = '<div class="mt-4"><h5><i class="fas fa-list me-2"></i>Individual Shares</h5>';
    names.forEach(function (name, index) {
        var share = 0;
        for (i = 0; i < N; i++) {
            share += graph[index][i];
        }
        if (share > 0 || share < 0) {
            var shareType = share > 0 ? 'owes' : 'is owed';
            var shareAmount = Math.abs(share);
            shareHTML += '<div class="expense-report-item">' +
                '<span><strong>' + name + '</strong> ' + shareType + ' ₹' + formatCurrency(shareAmount) + '</span>' +
                '</div>';
        }
    });
    shareHTML += '</div>';
    $("#ExpenseReportCardBody").append(shareHTML);

    // Display the settlement breakdown
    var settlementHTML = '<div class="mt-4"><h5><i class="fas fa-handshake me-2"></i>Who Pays Whom</h5></div>';
    $("#ExpenseReportCardBody").append(settlementHTML);

    // Perform minimum cash flow settlement
    minCashFlowRec(amount);
}

