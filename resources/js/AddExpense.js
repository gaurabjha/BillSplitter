// import SplitBill from './split_algo.js'; 

$(document).ready(function () {
	$('[data-toggle="tooltip"]').tooltip();
	$("#ExpenditureBody, #ExpenseReportCardBody, #ExpenseReportCard").hide();

	$('body').on('click', '*', function () { $(this).tooltip('hide') });

	var participants = []; //$("#participants").html().split(',');

	participantsOptionsSelected = ''
	participantsOptions = ''

	//alert(participants)
	// create the expense table action column
	var actions = '<td id="action" class="w-10">                          		' +
		'				<a class="delete justify-content-center" title="Delete" data-toggle="tooltip">	' +
		'					<i class="fas fa-trash-alt"></i>				' +
		'				</a>													' +
		'			</td>                                                 		';


	// Append table with add row form on add new button click

	function newColumn() {
		var index = $("#expenseTable tbody tr:last-child").index();
		var row = '<tr>' +
			'<td><select class="form-select" id="payee">' + participantsOptions + '</select></td>' +
			'<td><input type="text" class="form-control" id="summary" /></td>' +
			'<td><input type="number" class="form-control" id="amount" /></td>' +
			'<td> ' +
			'   <div><select id="choices-multiple-remove-button" multiple id="paidFor">' +
			participantsOptionsSelected +
			'	</select></div>' +
			'</td>' +
			actions +
			'</tr>';
		$("#expenseTable").append(row);
		$('[data-toggle="tooltip"]').tooltip();
		var multipleCancelButton = new Choices('#expenseTable tbody tr:last-child #choices-multiple-remove-button', {
			removeItemButton: true
		});
	}

	// newColumn();

	$(".add-new").click(function () {
		newColumn();
	});

	$(document).on("click", ".delete", function () {
		$(this).parents("tr").remove();
	});

	$("#AddExpenseButton").click(function () {

		//Create the Participants Options
		participants = $("input[id='person']")
			.map(function () { return $(this).val(); }).get();

		$('#BillName').html($('#meta-bill-name').val() + '<b> Expense</b>')
		$('#participants').html('for ' + participants.join())

		participants.forEach(element => {
			participantsOptionsSelected += '<option selected value="' + element + '">' + element + '</option>'
			participantsOptions += '<option value="' + element + '">' + element + '</option>'
		});

		//remove the Bill Meta data section and show the Add Expense Section
		$("#BillMetaCard").slideUp(1000);
		$("#ExpenditureBody, #ExpenseReportCard").slideDown(1000);
		$('#AddExpenseButton').remove()
		newColumn()
	});


	function createGraph(){


		/*
		'<td><select class="form-select" id="sel1" name="payee">' + participantsOptions + '</select></td>' +
			'<td><input type="text" class="form-control" name="summary" /></td>' +
			'<td><input type="number" class="form-control" name="amount" /></td>' +
			'<td> ' +
			'   <div><select id="choices-multiple-remove-button" multiple name="paidFor">' +
			participantsOptionsSelected +
			'	</select></div>' +
			'</td>' +
		*/
		$('#expenseTable > tbody  > tr').each(function(index, tr) { 
			console.log(index);
			console.log($(tr).find('#payee').val());
			// $(element).find('.name').text()
		 });
		// var expenseRows = $("#expenseTable tbody tr").forEach(element => {
		// 	console.log($(element).html());
		// });
	}

	$("#ExpenseReportButton").click(function () {

		//Create the Participants Options
		$("#ExpenseReportCardBody").html("")
		$("#ExpenseReportCardBody").slideDown(1000, function () {

			let graph = Array(participants.length).fill().map(() => Array(participants.length).fill(Math.floor((Math.random() * 10) + 1)));
			alert(graph)
			createGraph();
		// 	var graph = [[0, 1000, 2000, 500, 0],
		// 	[0, 0, 5000, 200, 1000],
		// 	[0, 0, 0, 0, 5000],
		// 	[0, 0, 0, 0, 5000],
		// 	[0, 0, 0, 0, 5000]		
		// ];
			

			// Print the solution
			// alert("Bill Object created");

			calculate(graph, participants)
		});
	});
});