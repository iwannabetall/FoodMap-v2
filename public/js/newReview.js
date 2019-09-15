$( document ).ready(function() {
	// change checkbox - Binding any event click, change or whatever to all checkboxes on the page can cause performance issues (depepending on the amount of checkboxes). Try binding to the parent element or the document and capturing the bubbled event i.e. 
	$('#restaurant_id').on('change', function(){ 		
		console.log(this.value)
		// console.log(this.dataset.name)
	});

	$('#update').on('click', function() {
		var restaurant_id = $('#restaurant_id').val()

		$.ajax({
			method: 'GET',
			url: '/update',
			dataType: 'json',
			data: {'id' : restaurant_id},
			success: function(data) {
				populateForm(data)
				console.log(data)
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				console.log(errorThrown)
				console.log(textStatus)
				console.log(XMLHttpRequest)
			}
		})

	})

	function populateForm(data) {

		$('#restaurant_id').val(data.id)
		$('#restaurant').val(data.restaurant)
		$('#cuisine').val(data.cuisine)
		$('#rating').val(data.rating)
		$('#value').val(data.value)
		$('#priceRange').val(data.pricerange)
		$('#itemsTried').val(data.tried)
		$('#thoughts').val(data.thoughts)
		$('#priceDetails').val(data.pricedetails)
		$('#return').val(data.wouldireturn)
		$('#highlights').val(data.highlights)
		$('#website').val(data.website)

	}

});

