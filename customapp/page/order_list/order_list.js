//frappe.provide("custom_app.PointOfSale");

frappe.pages["order-list"].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Order List"),
		single_column: true,
	});
	// frappe.require("order-list.bundle.js", function () {
	// 	wrapper.pos = new erpnext.PointOfSale.Controller(wrapper);
	// 	window.cur_pos = wrapper.pos;
	// });
};

// frappe.pages["order-list"].refresh = function (wrapper) {
// 	if (document.scannerDetectionData) {
// 		onScan.detachFrom(document);
// 		wrapper.pos.wrapper.html("");
// 		// wrapper.pos.check_opening_entry();
// 	}
// };
