import onScan from "onscan.js";
custom_app.PointOfSale.ItemSelector = class {
  
    constructor({ frm, wrapper, events, pos_profile, settings }) {
        this.wrapper = wrapper;
        this.events = events;
        this.pos_profile = pos_profile;
        this.hide_images = settings.hide_images;
        this.auto_add_item = settings.auto_add_item_to_cart;

        this.init_component();
    }

    init_component() {
        this.prepare_dom();
        this.make_search_bar();
        this.load_items_data();
        this.bind_events();
		//Highlight
        this.attach_shortcuts();
		this.inject_css(); 

        
    }

	//For highlight items 

	inject_css() {
		const css = `
			.highlight {
				background-color: #f2f2f2;

			}
            .text{
                font-size: 1em;
                font-weight: semi-bold;
            }
            .text-description{
                font-size: 1em;
                font-weight: semi-bold;
            }
            .quantity-field{
                width: 1rem;
                height: 10rem;
            }
            .custom-quantity-field {
                width: 200px; /* Adjust the width as needed */
            }
		`;
		const style = document.createElement('style');
		style.type = 'text/css';
		if (style.styleSheet) {
			style.styleSheet.cssText = css;
		} else {
			style.appendChild(document.createTextNode(css));
		}
		document.head.appendChild(style);
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
								<th>Vat</th>
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

        return frappe.call({
			method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.get_items",
            freeze: true,
            args: { start, page_length, price_list, item_group, search_term, pos_profile },
        });
    }

	//Camille
    render_item_list(items) {
        this.$items_container.html("");
        this.items = items;

        items.forEach((item) => {
            const item_html = this.get_item_html(item);
            this.$items_container.append(item_html);
        });

        this.highlighted_row_index = 0;
        this.highlight_row(this.highlighted_row_index);
    }

    
    get_item_html(item) {
        const me = this;
    
       const { item_name ,item_code, item_image, serial_no, batch_no, barcode, actual_qty, uom, price_list_rate, description, latest_expiry_date, batch_number,custom_is_vatable} = item;
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
				data-item-code="${escape(item_code)}" data-serial-no="${escape(serial_no)}"
				data-batch-no="${escape(batch_no)}" data-uom="${escape(uom)}"
				data-rate="${escape(price_list_rate || 0)}">
				<td class="item-code">${item_code}</td> 
			    <td class="item-name text-break">${frappe.ellipsis(item_name, 18)}</td>
				<td class="item-vat">${custom_is_vatable == 0 ? "VAT-Exempt" : "VATable"}</td>
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
                    	query: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.item_group_query",
                        filters: {
                            pos_profile: doc ? doc.pos_profile : "",
                        },
                    };
                },
            },
            parent: this.$component.find(".item-group-field"),
            render_input: true,
        });
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
    
        onScan.decodeKeyEvent = function(oEvent) {
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

        
        // 
        // let dialog
        let selectedUOM;
        this.$component.on("click", ".item-wrapper", async function() {
            const $item = $(this);
            me.selectedItem = $item;
            const item_code = unescape($item.attr("data-item-code"));
            const uom = unescape($item.attr("data-uom"));
            const rate = parseFloat(unescape($item.attr("data-rate")));
            const description = unescape($item.attr("data-description"));
            
            frappe.call({
                method: 'custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.get_item_uoms',
                args: {
                    item_code: item_code
                },
                callback: function(response) {
                    if (response.message) {
                        const uomOptions = response.message.uoms.map(uom => ({
                            label: uom.uom,
                            value: uom.uom
                        }));
        
                        const dialog = new frappe.ui.Dialog({
                            title: __("Item Details"),
                            fields: [
                                {
                                    fieldtype: "HTML",
                                    label: __("Item Code and Description"),
                                    options: `
                                        <div class="row mb-4">
                                            <div class="col-lg-6">
                                                <div class="card w-80 h-80">
                                                    <div class="card-body">
                                                        <p class="text-description">${item_code}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-lg-6">
                                                <div class="card w-80 h-80">
                                                    <div class="card-body">
                                                        <div class="row">
                                                            <div class="col">
                                                                <p class="text-description">${description}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `,
                                },
                                {
                                    fieldtype: "HTML",
                                    label: __("Quantity"),
                                    options: `
                                    <div class="row">
                                        <div class="col-lg">
                                            <div class="form-group">
                                                <label class="control-label">${__("Quantity")}</label>
                                                <input class="form-control" type="number" data-fieldname="quantity" required value="1" />
                                            </div>
                                        </div>
                                    </div>
                                    `
                                }, 
                                {
                                    fieldtype: 'Select',
                                    label: __("UOM"),
                                    fieldname: 'uom',
                                    options: uomOptions,
                                    default: 'PC'
                                },
                                {
                                    fieldtype: "HTML",
                                    label: __("Amount"),
                                    options: `
                                        <div class="row">
                                            <div class="col-lg">
                                                <div class="form-group">
                                                    <label class="control-label">Amount</label>
                                                    <input class="form-control" data-fieldname="total_amount" value="${rate.toFixed(2)}" readonly />
                                                </div>
                                            </div>
                                        </div>
                                    `
                                }
                            ],
                            primary_action_label: __("Ok"),
                            primary_action: function() {
                                const quantity = parseFloat(dialog.wrapper.find('input[data-fieldname="quantity"]').val());
                                const selectedUOM = dialog.wrapper.find('select[data-fieldname="uom"]').val();
                                const totalAmount = parseFloat(dialog.wrapper.find('input[data-fieldname="total_amount"]').val());
                                
                                if (!quantity || quantity <= 0) {
                                    frappe.msgprint(__("Please enter a valid quantity."));
                                    return;
                                }
        
                                dialog.hide();
        
                                if (!me.selectedItem) {
                                    frappe.msgprint(__("No item selected."));
                                    return;
                                }
        
                                me.selectedItem.find(".item-uom").text(selectedUOM);
        
                                const itemCode = unescape(me.selectedItem.attr("data-item-code"));
                                const batchNo = unescape(me.selectedItem.attr("data-batch-no"));
                                const serialNo = unescape(me.selectedItem.attr("data-serial-no"));
        
                                me.events.item_selected({
                                    field: "qty",
                                   value: "+" + quantity,
                                    item: { item_code: itemCode, batch_no: batchNo, serial_no: serialNo, uom: selectedUOM, quantity, rate: totalAmount },
                                });

                                me.search_field.set_focus();
                            }
                        });
        
                        dialog.show();
        
                        dialog.wrapper.find('input[data-fieldname="quantity"]').on('input', function () {
                            const quantity = parseFloat($(this).val());
                            if (!isNaN(quantity)) {
                                const totalAmount = (quantity * rate).toFixed(2);
                                dialog.wrapper.find('input[data-fieldname="total_amount"]').val(totalAmount);
                            } else {
                                dialog.wrapper.find('input[data-fieldname="total_amount"]').val(rate.toFixed(2));
                            }
                        });
                    }
                }
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
    
        this.$component.on("keydown", (e) => {
            const key = e.which || e.keyCode;
            switch (key) {
                case 38: // up arrow
                    e.preventDefault();
                    this.navigate_up();
                    break;
                case 40: // down arrow
                    e.preventDefault();
                    this.navigate_down();
                    break;
                case 9: // tab
                    e.preventDefault();
                    this.navigate_down();
                    this.focus_next_field();
                    break;
                case 13: // enter
                    e.preventDefault();
                    this.select_highlighted_item();
                    break;
            }
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
    
        frappe.ui.keys.on("enter", () => {
            const selector_is_visible = this.$component.is(":visible");
            const dialog_is_open = document.querySelector(".modal.show");
    
            if (!selector_is_visible || this.search_field.get_value() === "") return;
    
            if (this.items.length == 1) {
                this.$items_container.find(".item-wrapper").click();
                frappe.utils.play_sound("submit");
                this.set_search_value("");
            } else if (this.items.length == 0 && this.barcode_scanned) {
                frappe.show_alert({
                    message: __("No items found. Scan barcode again."),
                    indicator: "orange",
                });
                frappe.utils.play_sound("error");
                this.barcode_scanned = false;
                this.set_search_value("");
            }
    
            if (dialog_is_open && document.activeElement.tagName === "SELECT") {
                // Trigger action to add the selected item to the cart
                this.selectedItem.find(".item-uom").text(dialog.wrapper.find('select[data-fieldname="uom"]').val());
    
                const itemCode = unescape(this.selectedItem.attr("data-item-code"));
                const batchNo = unescape(this.selectedItem.attr("data-batch-no"));
                const serialNo = unescape(this.selectedItem.attr("data-serial-no"));
    
                this.events.item_selected({
                    field: "qty",
                    value: quantity,
                    item: { item_code: itemCode, batch_no: batchNo, serial_no: serialNo, uom: selectedUOM, quantity,rate},
                });
    
                this.search_field.set_focus();
            }
        });
    }
    
    // The rest of your class definition...
    
    focus_next_field() {
     
        const customerField = document.querySelector("_init_customer_selector"); 
        const doctorField = document.querySelector("init_doctor_selector"); 
    
        if (document.activeElement === this.search_field.$input[0]) {
            customerField.focus();
        } else if (document.activeElement === customerField) {
            doctorField.focus();
        }
    }
    
    navigate_up() {
        if (this.highlighted_row_index > 0) {
            this.highlighted_row_index--;
            this.highlight_row(this.highlighted_row_index);
        }
    }

    navigate_down() {
        if (this.highlighted_row_index < this.items.length - 1) {
            this.highlighted_row_index++;
            this.highlight_row(this.highlighted_row_index);
        }
    }

    highlight_row(index) {
        this.$items_container.find(".item-wrapper").removeClass("highlight");
        this.$items_container.find(".item-wrapper").eq(index).addClass("highlight");
    }

    select_highlighted_item() {
        this.$items_container.find(".item-wrapper").eq(this.highlighted_row_index).click();
    }

    
    

	//end here

    filter_items({ search_term = "" } = {}) {
        if (search_term) {
            search_term = search_term.toLowerCase();

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
