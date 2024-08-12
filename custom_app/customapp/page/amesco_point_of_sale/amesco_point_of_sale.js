frappe.provide("custom_app.PointOfSale");

frappe.pages['amesco-point-of-sale'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Amesco Point Of Sale',
		single_column: true
	});

	frappe.require("amesco-point-of-sale.bundle.js", function () {
		wrapper.pos = new custom_app.PointOfSale.Controller(wrapper);
		window.cur_pos = wrapper.pos;
	});

}

frappe.pages["amesco-point-of-sale"].refresh = function (wrapper) {
	if (document.scannerDetectionData) {
		onScan.detachFrom(document);
		wrapper.pos.wrapper.html("");
	    wrapper.pos.check_opening_entry();
	}
};
