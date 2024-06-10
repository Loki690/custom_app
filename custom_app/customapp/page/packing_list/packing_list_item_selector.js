import onScan from "onscan.js";

custom_app.PointOfSale.ItemSelector = class {
	// eslint-disable-next-line no-unused-vars
	constructor({ frm, wrapper, events, pos_profile, settings }) {
		this.wrapper = wrapper;
		this.events = events;
		this.pos_profile = pos_profile;
		this.hide_images = settings.hide_images;
		this.auto_add_item = settings.auto_add_item_to_cart;
		this.inti_component();
	}

	inti_component() {
		this.prepare_dom();
		this.make_search_bar();
		this.load_items_data();
		this.bind_events();
		this.attach_shortcuts();
		this.get_serial_number();

	}

	prepare_dom() {
		const selectedWarehouse = localStorage.getItem('selected_warehouse');
		this.wrapper.append(
			`<section class="items-selector">
				<div class="filter-section">
				<div class="label">
				${__("All Items")} ${selectedWarehouse ? selectedWarehouse : ""}
			</div>
					<div class="item-group-field"></div>
					<div class="search-field"></div>
				</div>
				<div class="table-responsive">
					<table class="table items-table">
					    <thead style="position: sticky; top: 0; background-color: #fff; z-index: 1;">
							<tr>
								<th>Item Code</th>
								<th>Name</th>
								<th>Price</th>
								<th>UOM</th>
								<th>QTY</th>
							</tr>
						</thead>

						<tbody class="items-container"></tbody>
					</table>
				</div>
			</section>`
		);

		this.$component = this.wrapper.find(".items-selector");
		this.$items_container = this.$component.find(".items-container");
	}

	async load_items_data() {
		if (!this.item_group) {
			const res = await frappe.db.get_value("Item Group", { lft: 1, is_group: 1 }, "name");
			this.parent_item_group = res.message.name;
		}
		if (!this.price_list) {
			const res = await frappe.db.get_value("POS Profile", this.pos_profile, "selling_price_list");
			this.price_list = res.message.selling_price_list;
		}

		this.get_items({}).then(({ message }) => {
			this.render_item_list(message.items);
		});
	}

	get_items({ start = 0, page_length = 40, search_term = "" }) {
		const doc = this.events.get_frm().doc;
		const price_list = (doc && doc.selling_price_list) || this.price_list;
		let { item_group, pos_profile } = this;

		!item_group && (item_group = this.parent_item_group);

		// Get the selected warehouse from local storage
		const selected_warehouse = localStorage.getItem('selected_warehouse');

		return frappe.call({
			method: "custom_app.customapp.page.packing_list.packing_list.get_items",
			freeze: true,
			args: {
				start,
				page_length,
				price_list,
				item_group,
				search_term,
				pos_profile,
				selected_warehouse  // Include selected warehouse in the request
			},
		});
	}


	get_serial_number() {
		frappe.call({
			method: "custom_app.customapp.page.packing_list.packing_list.serial_number", // Replace with the correct path
			callback: function (response) {
				if (response.message) {
					const retrieved_serial = response.message;
					// Use the 'retrieved_serial' variable here for further processing or display
					//console.log(retrieved_serial); // Example: Display the serial number in the console
				} else {
					frappe.throw(__("Error fetching serial number"));
				}
			}
		});
	}

	render_item_list(items) {
		this.$items_container.html("");

		items.forEach((item) => {
			const item_html = this.get_item_html(item);
			this.$items_container.append(item_html);
		});
	}




	get_item_html(item) {
		const me = this;

		// eslint-disable-next-line no-unused-vars
		const { item_code, item_image, serial_no, batch_no, barcode, actual_qty, uom, price_list_rate, description, latest_expiry_date, batch_number,} = item;
		const precision = flt(price_list_rate, 2) % 1 != 0 ? 2 : 0;
		let indicator_color;
		let qty_to_display = actual_qty;

		if (item.is_stock_item) {
			indicator_color = actual_qty > 10 ? "green" : actual_qty <= 0 ? "red" : "orange";

			if (Math.round(qty_to_display) > 999) {
				qty_to_display = Math.round(qty_to_display) / 1000;
				qty_to_display = qty_to_display.toFixed(1) + "K";
			}
		} else {
			indicator_color = "";
			qty_to_display = "";
		}

		return `<tr class="item-wrapper" style="border-bottom: 1px solid #ddd;" onmouseover="this.style.backgroundColor='#f2f2f2';" onmouseout="this.style.backgroundColor='';"
				data-item-code="${escape(item.item_code)}" data-serial-no="${escape(serial_no)}"
				data-batch-no="${escape(batch_no)}" data-uom="${escape(uom)}"
				data-rate="${escape(price_list_rate || 0)}">
				<td class="item-code">${item_code}</td> 
				<td class="item-name text-break">${frappe.ellipsis(item.item_name, 18)}</td>
				<td class="item-rate text-break">${format_currency(price_list_rate, item.currency, precision) || 0}</td>
				<td class="item-uom"> ${uom} / count per uom </td>
				<td class="item-qty"><span class="indicator-pill whitespace-nowrap ${indicator_color}">${qty_to_display}</span></td>
			</tr>`;
		//<td class="item-description text-break">${description}</td>
	}

	handle_broken_image($img) {
		const item_abbr = $($img).attr("alt");
		$($img).parent().replaceWith(`<div class="item-display abbr">${item_abbr}</div>`);
	}

	make_search_bar() {
		const me = this;
		const doc = me.events.get_frm().doc;
		this.$component.find(".search-field").html("");
		this.$component.find(".item-group-field").html("");
		//branch field
		// this.$component.find(".branch-field").html("");

		this.search_field = frappe.ui.form.make_control({
			df: {
				label: __("Search"),
				fieldtype: "Data",
				placeholder: __("Search by item code, serial number or barcode"),
			},
			parent: this.$component.find(".search-field"),
			render_input: true,
		});
		this.item_group_field = frappe.ui.form.make_control({
			df: {
				label: __("Item Group"),
				fieldtype: "Link",
				options: "Item Group",
				placeholder: __("Select item group"),
				onchange: function () {
					me.item_group = this.value;
					!me.item_group && (me.item_group = me.parent_item_group);
					me.filter_items();
				},
				get_query: function () {
					return {
						query: "erpnext.selling.page.order_list.order_list.item_group_query",
						filters: {
							pos_profile: doc ? doc.pos_profile : "",
						},
					};
				},
			},
			parent: this.$component.find(".item-group-field"),
			render_input: true,
		});

		// this.brach_field = frappe.ui.form.make_control({
		// 	df: {
		// 		label: _("Branch"),
		// 		fieldtype: "Link",
		// 		options: "Warehouse",
		// 		placeholder: _("Select warehouse"),
		// 		onchange: function () {
		// 			me.branch = this.value;
		// 		},

		// 	},
		// 	parent: this.$component.find(".branch-field"),
		// 	render_input: true,
		// })

		this.search_field.toggle_label(false);
		this.item_group_field.toggle_label(false);

		this.attach_clear_btn();
	}

	attach_clear_btn() {
		this.search_field.$wrapper.find(".control-input").append(
			`<span class="link-btn" style="top: 2px;">
				<a class="btn-open no-decoration" title="${__("Clear")}">
					${frappe.utils.icon("close", "sm")}
				</a>
			</span>`
		);

		this.$clear_search_btn = this.search_field.$wrapper.find(".link-btn");

		this.$clear_search_btn.on("click", "a", () => {
			this.set_search_value("");
			this.search_field.set_focus();
		});
	}

	set_search_value(value) {
		$(this.search_field.$input[0]).val(value).trigger("input");
	}

	bind_events() {
		const me = this;
		window.onScan = onScan;

		onScan.decodeKeyEvent = function (oEvent) {
			var iCode = this._getNormalizedKeyNum(oEvent);
			switch (true) {
				case iCode >= 48 && iCode <= 90: // numbers and letters
				case iCode >= 106 && iCode <= 111: // operations on numeric keypad (+, -, etc.)
				case (iCode >= 160 && iCode <= 164) || iCode == 170: // ^ ! # $ *
				case iCode >= 186 && iCode <= 194: // (; = , - . / `)
				case iCode >= 219 && iCode <= 222: // ([ \ ] ')
				case iCode == 32: // spacebar
					if (oEvent.key !== undefined && oEvent.key !== "") {
						return oEvent.key;
					}

					var sDecoded = String.fromCharCode(iCode);
					switch (oEvent.shiftKey) {
						case false:
							sDecoded = sDecoded.toLowerCase();
							break;
						case true:
							sDecoded = sDecoded.toUpperCase();
							break;
					}
					return sDecoded;
				case iCode >= 96 && iCode <= 105: // numbers on numeric keypad
					return 0 + (iCode - 96);
			}
			return "";
		};

		onScan.attachTo(document, {
			onScan: (sScancode) => {
				if (this.search_field && this.$component.is(":visible")) {
					this.search_field.set_focus();
					this.set_search_value(sScancode);
					this.barcode_scanned = true;
				}
			},
		});

		this.$component.on("click", ".item-wrapper", function () {
			const $item = $(this);
			const item_code = unescape($item.attr("data-item-code"));
			let batch_no = unescape($item.attr("data-batch-no"));
			let serial_no = unescape($item.attr("data-serial-no"));
			let uom = unescape($item.attr("data-uom"));
			let rate = unescape($item.attr("data-rate"));

			// escape(undefined) returns "undefined" then unescape returns "undefined"
			batch_no = batch_no === "undefined" ? undefined : batch_no;
			serial_no = serial_no === "undefined" ? undefined : serial_no;
			uom = uom === "undefined" ? undefined : uom;
			rate = rate === "undefined" ? undefined : rate;

			me.events.item_selected({
				field: "qty",
				value: "+1",
				item: { item_code, batch_no, serial_no, uom, rate },
			});
		});

		this.search_field.$input.on("input", (e) => {
			clearTimeout(this.last_search);
			this.last_search = setTimeout(() => {
				const search_term = e.target.value;
				this.filter_items({ search_term });
			}, 300);

			this.$clear_search_btn.toggle(Boolean(this.search_field.$input.val()));
		});

		this.search_field.$input.on("focus", () => {
			this.$clear_search_btn.toggle(Boolean(this.search_field.$input.val()));
		});
	}

	attach_shortcuts() {
		const ctrl_label = frappe.utils.is_mac() ? "⌘" : "Ctrl";
		this.search_field.parent.attr("title", `${ctrl_label}+I`);
		frappe.ui.keys.add_shortcut({
			shortcut: "ctrl+i",
			action: () => this.search_field.set_focus(),
			condition: () => this.$component.is(":visible"),
			description: __("Focus on search input"),
			ignore_inputs: true,
			page: cur_page.page.page,
		});
		this.item_group_field.parent.attr("title", `${ctrl_label}+G`);
		frappe.ui.keys.add_shortcut({
			shortcut: "ctrl+g",
			action: () => this.item_group_field.set_focus(),
			condition: () => this.$component.is(":visible"),
			description: __("Focus on Item Group filter"),
			ignore_inputs: true,
			page: cur_page.page.page,
		});

		// for selecting the last filtered item on search
		frappe.ui.keys.on("enter", () => {
			const selector_is_visible = this.$component.is(":visible");
			if (!selector_is_visible || this.search_field.get_value() === "") return;

			if (this.items.length == 1) {
				this.$items_container.find(".item-wrapper").click();
				frappe.utils.play_sound("submit");
				this.set_search_value("");
			} else if (this.items.length == 0 && this.barcode_scanned) {
				// only show alert of barcode is scanned and enter is pressed
				frappe.show_alert({
					message: __("No items found. Scan barcode again."),
					indicator: "orange",
				});
				frappe.utils.play_sound("error");
				this.barcode_scanned = false;
				this.set_search_value("");
			}

			console.log("Click")
		});
	}

	filter_items({ search_term = "" } = {}) {
		if (search_term) {
			search_term = search_term.toLowerCase();

			// memoize
			this.search_index = this.search_index || {};
			if (this.search_index[search_term]) {
				const items = this.search_index[search_term];
				this.items = items;
				this.render_item_list(items);
				this.auto_add_item && this.items.length == 1 && this.add_filtered_item_to_cart();
				return;
			}
		}

		this.get_items({ search_term }).then(({ message }) => {
			// eslint-disable-next-line no-unused-vars
			const { items, serial_no, batch_no, barcode } = message;
			if (search_term && !barcode) {
				this.search_index[search_term] = items;
			}
			this.items = items;
			this.render_item_list(items);
			this.auto_add_item && this.items.length == 1 && this.add_filtered_item_to_cart();
		});
	}

	add_filtered_item_to_cart() {
		this.$items_container.find(".item-wrapper").click();
		this.set_search_value("");
		
	}

	resize_selector(minimize) {
        if (minimize) {
            this.$component.css({
                "opacity": "0",               // Make the component invisible
                "pointer-events": "none",     // Make the component non-interactive
                "grid-column": "span 1 / span 1",
                "grid-template-columns": "repeat(13, minmax(0, 1fr))"
            });
        } else {
            this.$component.css({
                "opacity": "1",               // Make the component visible
                "pointer-events": "auto",     // Make the component interactive
                "grid-column": "span 6 / span 6"
            });

            this.$component.find(".filter-section")
                .css("grid-template-columns", "repeat(12, minmax(0, 1fr))");

            this.$component.find(".search-field").css("margin", "0px var(--margin-sm)");

            this.$items_container.css("grid-template-columns", "repeat(4, minmax(0, 1fr))");
        }
    }

	toggle_component(show) {
		this.set_search_value("");
		this.$component.css("display", show ? "flex" : "none");
	}
};