custom_app.PointOfSale.PastOrderList = class {
	constructor({ wrapper, events }) {
		this.wrapper = wrapper;
		this.events = events;

		this.init_component();
	}

	init_component() {
		this.prepare_dom();
		this.make_filter_section();
		this.bind_events();
	}

	prepare_dom() {
		this.wrapper.append(
			`<section class="past-order-list">
				<div class="filter-section">
					<div class="label">${__("Pending Orders")} <span class="invoice-count ml-3 badge rounded-pill bg-danger text-white"></span> </div>
					<div class="search-field"></div>
					<div class="status-field"></div>
				</div>
				<div class="invoices-container"></div>
			</section>`
		);

		this.$component = this.wrapper.find(".past-order-list");
		this.$invoices_container = this.$component.find(".invoices-container");
		this.$invoice_count = this.$component.find(".invoice-count");
	}

	bind_events() {
		// this.search_field.$input.on("input", (e) => {
		// 	clearTimeout(this.last_search);
		// 	this.last_search = setTimeout(() => {
		// 		const search_term = e.target.value;
		// 		this.refresh_list(search_term, this.status_field.get_value());
		// 	}, 300);
		// });
		const me = this;
		this.$invoices_container.on("click", ".invoice-wrapper", function () {
			const invoice_name = unescape($(this).attr("data-invoice-name"));

			me.events.open_invoice_data(invoice_name);
		});


		this.$invoices_container.off('keydown', '.invoice-wrapper').on('keydown', '.invoice-wrapper', function(event) {
			const $items = me.$invoices_container.find('.invoice-wrapper');
			const currentIndex = $items.index($(this));
			let nextIndex = currentIndex;
	
			switch (event.which) {
				case 13: // Enter key
					$(this).trigger('click'); // Trigger click event immediately on Enter key press
					break;
				case 38: // Up arrow key
					nextIndex = currentIndex > 0 ? currentIndex - 1 : $items.length - 1;
					break;
				case 40: // Down arrow key
					nextIndex = currentIndex < $items.length - 1 ? currentIndex + 1 : 0;
					break;
				default:
					return; // Exit if other keys are pressed
			}
	
			$items.eq(nextIndex).focus(); // Move focus to the next item
		});
	
		frappe.ui.keys.add_shortcut({
			shortcut: 'ctrl+i',
			action: () => {
				const $items = me.$invoices_container.find('.invoice-wrapper');
				if ($items.length) {
					$items.first().focus(); // Focus on the first cart item
				}
			},
			condition: () => me.$invoices_container.is(':visible'),
			description: __('Activate Cart Item Focus'),
			ignore_inputs: true,
			page: cur_page.page.page // Replace with your actual page context
		});




	}

	make_filter_section() {
		const me = this;
		
		// Search field for invoice ID or customer name
		this.search_field = frappe.ui.form.make_control({
			df: {
				label: __("Search"),
				fieldtype: "Data",
				placeholder: __("Search by invoice id or customer name"),
			},
			parent: this.$component.find(".search-field"),
			render_input: true,
		});
		
		// Status field for filtering invoices by status
		this.status_field = frappe.ui.form.make_control({
			df: {
				label: __("Invoice Status"),
				fieldtype: "Select",
				options: `Draft`,
				placeholder: __("Filter by invoice status"),
				onchange: function () {
					// Auto-refresh the list when the status is changed
					if (me.$component.is(":visible")) me.refresh_list();
				},
			},
			parent: this.$component.find(".status-field"),
			render_input: true,
		});
	
		// Show label for search field and hide it for status field
		this.search_field.toggle_label(true);
		this.status_field.toggle_label(false);
	
		// Set default value for the status field to "Draft"
		this.status_field.set_value("Draft");
	
		// Focus on the search field after rendering
		setTimeout(() => {
			this.search_field.$input.focus();
		}, 100);
	
		// Debounce function to delay search execution while typing
		let last_search = null;
		this.search_field.$input.on("input", function (e) {
			clearTimeout(last_search);
			last_search = setTimeout(() => {
				const search_term = e.target.value;
				me.refresh_list(search_term, me.status_field.get_value());
			}, 300); // Adjust the delay (in ms) as needed
		});
	}

	// refresh_list() {
	// 	frappe.dom.freeze();
	// 	this.events.reset_summary();
	// 	const search_term = this.search_field.get_value();
	// 	const status = this.status_field.get_value();
	// 	const pos_profile = this.events.pos_profile();
	// 	const source_warehouse = this.events.source_warehouse();

	// 	this.$invoices_container.html("");

	// 	return frappe.call({
	// 		method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.get_past_order_list",
	// 		freeze: true,
	// 		args: { search_term, status, pos_profile },
	// 		callback: (response) => {
	// 			frappe.dom.unfreeze();
	// 			response.message.forEach((invoice) => {
	// 				const invoice_html = this.get_invoice_html(invoice);
	// 				this.$invoices_container.append(invoice_html);
	// 			});
			
	// 			this.$invoice_count.text(response.message.length);
	// 		},
	// 	});
	// }

	refresh_list(page = 1) {
		frappe.dom.freeze();
		this.events.reset_summary();
		
		const search_term = this.search_field.get_value();
		const status = this.status_field.get_value();
		const pos_profile = this.events.pos_profile();
		const source_warehouse = this.events.source_warehouse();
	
		this.$invoices_container.html("");
	
		const limit = 40;  // Page limit: 40 invoices per page
		const offset = (page - 1) * limit;  // Calculate offset based on the current page
	
		return frappe.call({
			method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.get_past_order_list",
			freeze: true,
			args: { search_term, status, pos_profile, limit, offset },  // Pass limit and offset
			callback: (response) => {
				frappe.dom.unfreeze();
	
				// Render the fetched invoices
				response.message.forEach((invoice) => {
					const invoice_html = this.get_invoice_html(invoice);
					this.$invoices_container.append(invoice_html);
				});
	
				// Update the invoice count
				this.$invoice_count.text(response.message.length);
			},
		});
	}

	get_invoice_html(invoice) {
		const posting_datetime = moment(invoice.posting_date + " " + invoice.posting_time).format(
			"Do MMMM, h:mma"
		);
		return `<div class="invoice-wrapper" tabindex="0" data-invoice-name="${escape(invoice.name)}">
				<div class="invoice-name-date">
					<div class="invoice-name">${invoice.name}</div>
					<div class="invoice-date">
						<svg class="mr-2" width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
						</svg>
						${frappe.ellipsis(invoice.customer_name, 20)}
					</div>
				</div>
				<div class="invoice-total-status">
					<div class="invoice-total">${format_currency(invoice.grand_total, invoice.currency) || 0}</div>
					<div class="invoice-date">${posting_datetime}</div>
				</div>
			</div>
			<div class="seperator"></div>`;
	}

	toggle_component(show) {
		show
			? this.$component.css("display", "flex")
			: this.$component.css("display", "none");
	}
};
