function addExpense() {
    var table = document.getElementById("myTable");
    table.innerHTML += generateExpenseRow();
}


function generateExpenseRow(){

    return "     <tr *ngFor=\"let field of fieldArray; let i = index\">                                                            " +
           "         <td>                                                                                                          " +
           "             <input [(ngModel)]=\"field.code\" class=\"form-control\" name=\"{{field.code}}\" type=\"text\"/>          " +
           "         </td>                                                                                                         " +
           "         <td>                                                                                                          " +
           "             <input [(ngModel)]=\"field.name\" class=\"form-control\" name=\"{{field.name}}\" type=\"text\"/>          " +
           "         </td>                                                                                                         " +
           "         <td>                                                                                                          " +
           "             <input [(ngModel)]=\"field.price\" class=\"form-control\" name=\"{{field.price}}\"                        " +
           "                    type=\"number\" onBlur=\"updateExpense(this)\"/>                                                   " +
           "         </td>                                                                                                         " +
           "         <td>                                                                                                          " +
           "             <div class=\"dropdown\">                                                                                  " +
           "                 <button class=\"btn btn-secondary dropdown-toggle\" data-toggle=\"dropdown\"                          " +
           "                         type=\"button\">                                                                              " +
           "                     DEFAULT:ALL                                                                                       " +
           "                 </button>                                                                                             " +
           "                 <div class=\"dropdown-menu\">                                                                         " +
           "                     <button class=\"dropdown-item\" type=\"button\">                                                  " +
           "                         <input type=\"checkbox\" checked=\"true\">Gaurab                                              " +
           "                     </button>                                                                                         " +
           "                 </div>                                                                                                " +
           "             </div>                                                                                                    " +
           "         </td>                                                                                                         " +
           "         <td>                                                                                                          " +
           "                 <button onClick=\"deleteExpense(this)\" class=\"btn btn-default\" type=\"button\">Delete</button>  " +
           "         </td>                                                                                                         " +
           "     </tr>                                                                                                             " ;
}

function initExpense(btnn){
//    alert(document.getElementById("bill-name").value )
//    if(document.getElementById("bill-name").value == ""){
//        alert("Hi, bill-name cannot be empty")
//        return false;
//    }
    var table = document.getElementById("myTable");

    table.innerHTML =  "     <thead class=\"table-secondary\">                                                                                      " +
                       "     <tr>                                                                                                              " +
                       "         <th>Paid By</th>                                                                                              " +
                       "         <th>Paid For</th>                                                                                             " +
                       "         <th>Amount</th>                                                                                               " +
                       "         <th>Shared By</th>                                                                                            " +
                       "         <th>Action</th>                                                                                               " +
                       "     </tr>                                                                                                             " +
                       "     </thead>                                                                                                          " +
                       generateExpenseRow();
    //addExpense();
}

function updateExpense(expenseAmount){
    var amount = document.getElementById("total-expense").innerHTML;
    document.getElementById("total-expense").innerHTML = parseFloat(amount) + parseFloat(expenseAmount.value)
    
}

function deleteExpense(rowId) {
    rowId.parentElement.parentElement.innerHTML = "";
}

function generateRandomId() {
    let id = new Uint32Array(1);
    return window.crypto.getRandomValues(id);
}