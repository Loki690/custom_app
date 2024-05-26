frappe.pages['amesco-point-of-sale'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Amesco Point Of Sale',
		single_column: true
	});
}