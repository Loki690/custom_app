frappe.provide("custom_app.PointOfSale");

frappe.pages['packing-list'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Clerk',
		single_column: true
	});

	frappe.require("packing-list.bundle.js", function () {
		wrapper.pos = new custom_app.PointOfSale.Controller(wrapper);
		window.cur_pos = wrapper.pos;
	});

}

frappe.pages["packing-list"].refresh = function (wrapper) {
	if (document.scannerDetectionData) {
		onScan.detachFrom(document);
		wrapper.pos.wrapper.html("");
		// wrapper.pos.check_opening_entry();
	}
};