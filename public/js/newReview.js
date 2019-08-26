$( document ).ready(function() {
	// change checkbox - Binding any event click, change or whatever to all checkboxes on the page can cause performance issues (depepending on the amount of checkboxes). Try binding to the parent element or the document and capturing the bubbled event i.e. 
	$('#restaurant_id').on('change', function(){ 		
		console.log(this.value)
		// console.log(this.dataset.name)
	});

});

