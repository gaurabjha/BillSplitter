alert("Script Loaded")
$(document).ready(function(){
	alert("Ready Jquery Called")
	$('[data-toggle="tooltip"]').tooltip();

	$('body').on('click', '*', function () { $(this).tooltip('hide') });

	
    // $("#commentForm").validate({
	// 	onfocusout: function(element) {
	// 		this.element(element);
	// 	},
    // });

	var participants = $("#participants").html().split(',');
	//alert(array[1]);


	participantsOptionsSelected = ''
	participantsOptions = ''

	// participants.forEach(element => {
	// 	participantsOptions += '<button class="dropdown-item" type="button"><input type="checkbox" checked="true">' + element + '</button>'
	// });

	participants.forEach(element => {
		participantsOptionsSelected += '<option selected value="' + element + '">' + element + '</option>'
		participantsOptions += '<option value="' + element + '">'

	});

	//alert(participants)
	// create the expense table action column
	var actions = 	'<td id="action" class="w-10">                                    ' +
					'	<a class="add" title="Add" data-toggle="tooltip"><i           ' +
					'			class="material-icons">&#xE03B;</i></a>               ' +
					'	<a class="edit" title="Edit" data-toggle="tooltip"><i         ' +
					'			class="material-icons">&#xE254;</i></a>               ' +
					'	<a class="delete" title="Delete" data-toggle="tooltip"><i     ' +
					'			class="material-icons">&#xE872;</i></a>               ' +
					'</td>                                                            ' ;


	// Append table with add row form on add new button click

	function newColumn(){
		var index = $("#expenseTable tbody tr:last-child").index();
        var row = '<tr>' +
			'<td><input class="form-control" list="payee" name="paidBy" id="paidBy" required>' + 
			'	<datalist id="payee"> ' + participantsOptions + '</datalist>' +
			'<td><input type="text" class="form-control" name="summary" required/></td>' +
			'<td><input type="number" class="form-control" name="amount" required/></td>' +
			'<td> ' +  
			'   <div><select id="choices-multiple-remove-button" multiple name="paidFor">' +
			participantsOptionsSelected +
			'	</select></div>' +
			'</td>' +
			actions +
        '</tr>';
    	$("#expenseTable").append(row);
		$("#expenseTable tbody tr").eq(index + 1).find(".add, .edit").toggle();
        $('[data-toggle="tooltip"]').tooltip();
		var multipleCancelButton = new Choices('#expenseTable tbody tr:last-child #choices-multiple-remove-button', {
			removeItemButton: true
			});
	}


	newColumn();

    $(".add-new").click(function(){
		newColumn();
    });

	 
	// Add row on add button click
	$(document).on("click", ".add", function(){
		var empty = false;
		// var input = $(this).parents("tr").find('input');
		var input = $(this).parents("tr").find('input[name="amount"], input[name="summary"], select[name="paidFor"]');
        input.each(function(){
			alert("Working with Element" + $(this).html())
			if(!$(this).val()){
				$(this).addClass("error");
				empty = true;
			} else{
                $(this).removeClass("error");
            }
		});
		$(this).parents("tr").find(".error").first().focus();
		if(!empty){
			input.each(function(){
				$(this).parent("td").html($(this).val());
			});			
			$(this).parents("tr").find(".add, .edit").toggle();
			$(".add-new").removeAttr("disabled");
		}		
    });
	// Edit row on edit button click
	$(document).on("click", ".edit", function(){		
        $(this).parents("tr").find("td:not(:last-child,:nth-last-child(2))").each(function(){
			$(this).html('<input type="text" class="form-control" value="' + $(this).text() + '">');
		});		
		$(this).parents("tr").find(".add, .edit").toggle();
		$(".add-new").attr("disabled", "disabled");
    });
	// Delete row on delete button click
	$(document).on("click", ".delete", function(){
        $(this).parents("tr").remove();
		$(".add-new").removeAttr("disabled");
    });
});