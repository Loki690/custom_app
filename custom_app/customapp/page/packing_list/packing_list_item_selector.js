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
        this.attach_shortcuts();
        this.inject_css();
        localStorage.setItem('is_generics', 0);
    }

    //For highlight items 

    inject_css() {
        const css = `
			.highlight {
				background-color: #0289f7;
                color: white;
                font-weight: bold;
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
            `<section class="items-selector" style="margin-top:0.3rem; grid-column: span 4 / span 4;">

                <div class="filter-section" style="display: flex; align-items: center; gap: 10px;">
                    <div class="label" style="flex: 1;">
                        ${__("All Items")} ${selectedWarehouse ? selectedWarehouse : ""}
                    </div>
                    <div class="search-field" style="flex: 2;">
                        <input type="text" placeholder="Search by item code, serial number or barcode" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
                    </div>
                    <div class="item-group-field" style="flex: 1;">
                        <input type="text" placeholder="Select item group" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
                    </div>
                     <div class="generics" style="flex: 1;">
                        <input type="checkbox" id="generics">
                        <label for="generics">Generics</label>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table items-table">
                        <thead style="position: sticky; top: 0; background-color: #fff; z-index: 1; font-size:11px;">
                            <tr>
                                <th>Item Code</th>
                                <th>Name</th>
                                <th>Generic Name</th>
                                <th>Vat Type</th>
                                <th>Price</th>
                                <th>UOM</th>
                                <th>QOH</th>
                            </tr>
                        </thead>
                        <tbody class="items-container"></tbody>
                    </table>
                </div>
            </section>
            `
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

        // Set the UOM to PC
        this.selected_uom = "PC";
        if (this.item_uom) {
            this.item_uom.set_value("PC");
            this.item_uom.refresh();
        }

        // Retrieve and render items immediately after setting the values
        const { message } = await this.get_items({});
        this.render_item_list(message.items);

        // Trigger the filter function to apply the UOM filter
        this.filter_items({ uom: this.selected_uom });
    }


    get_items({ start = 0, page_length = 60, search_term = "" }) {
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
                selected_warehouse,  // Include selected warehouse in the request
                is_generics: localStorage.getItem('is_generics') || 0, // Pass is_generics from local storage
            },
        });
    }

    //Camille
    render_item_list(items) {
        // Clear the current items in the container
        this.$items_container.html("");

        // Filter items where the unit of measurement (UOM) is "PC"
        // const filtered_items_pc_uom = items.filter(item => item.uom === "PC");
        // console.log("Filtered Items (UOM = PC): ", filtered_items_pc_uom);

        // Set the class property `items` to the filtered items
        this.items = items;
        // Log all filtered items to the console

        items.forEach((item) => {
            const item_html = this.get_item_html(item);
            this.$items_container.append(item_html);
        });

        this.highlighted_row_index = -1;
        this.highlight_row(this.highlighted_row_index);
    }


    get_item_html(item) {
        const me = this;

        const { item_code, item_image, serial_no, batch_no, barcode, actual_qty, uom, price_list_rate, description, latest_expiry_date, batch_number, custom_is_vatable, custom_generic_name, item_group } = item;
        const precision = flt(price_list_rate, 2) % 1 != 0 ? 2 : 0;
        let indicator_color;
        let qty_to_display = actual_qty;

        if (uom !== "PC") {
            return ""; // Skip rendering if UOM is not 'PC'
        }

        // console.log("Actual QTY ", qty_to_display)

        if (item.is_stock_item) {
            indicator_color = actual_qty > 10 ? "green" : actual_qty <= 0 ? "red" : "orange";

            // if (Math.round(qty_to_display) > 999) {
            //     qty_to_display = Math.round(qty_to_display) / 1000;
            //     qty_to_display = qty_to_display.toFixed(1) + "K";
            // }

        } else {
            indicator_color = "";
            qty_to_display = "";
        }
        const tax_rate = 0.12;
        const no_vat = price_list_rate / (1 + tax_rate);


        const item_description = description ? description : "Description not available";

        return `<tr class="item-wrapper" style="border-bottom: 1px solid #ddd; font-size: 12px;" 
        onmouseover="this.style.backgroundColor='#0289f7'; this.style.color='white'; this.style.fontWeight='bold';"
        onmouseout="this.style.backgroundColor=''; this.style.color=''; this.style.fontWeight='';"
            data-item-code="${escape(item_code)}" data-serial-no="${escape(serial_no)}"
            data-batch-no="${escape(batch_no)}" data-uom="${escape(uom)}"
            data-rate="${escape(price_list_rate || 0)}" data-description="${escape(item_description)}" data-qty="${qty_to_display}">
            <td class="item-code" style=" width: 1rem;">${item_code}</td> 
             <td class="item-name" style="width: 15rem; white-space: normal; overflow: hidden; text-overflow: ellipsis;">${item.item_name}</td>
            <td class="item-name" style="width: 8rem; white-space: normal; overflow: hidden; text-overflow: ellipsis;">${custom_generic_name ? custom_generic_name : ''}</td>
            <td class="item-vat" style=" width: 10%;">${custom_is_vatable == 0 ? "VAT-Exempt" : "VATable"}</td>
            <td class="item-rate" style=" width:8%;">${format_currency(price_list_rate, item.currency)}</td>
            <td class="item-uom" style=" width: 5%;">${uom}</td>
            <td class="item-qty" style=" width: 8%;"><span class="indicator-pill whitespace-nowrap ${indicator_color}">${actual_qty}</span></td>
        </tr>`;
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
        // this.$component.find(".item-uoms").html("");
        //branch field
        // this.$component.find(".branch-field").html("");
        this.$component.find(".generics").html("");

        this.search_field = frappe.ui.form.make_control({
            df: {
                label: __("Search"),
                fieldtype: "Data",
                placeholder: __("Search by item code, serial number, barcode, generic name or description"),
            },
            parent: this.$component.find(".search-field"),
            render_input: true,
        });



        this.search_field.$input.on('input', () => {
            let value = this.search_field.get_value().trim(); // Get and trim the input value
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
                        query: "custom_app.customapp.page.packing_list.packing_list.item_group_query",
                        filters: {
                            pos_profile: doc ? doc.pos_profile : "",
                        },
                    };
                },
            },
            parent: this.$component.find(".item-group-field"),
            render_input: true,
        });


        this.item_group_field.$input.on('input', () => {
            let value = this.item_group_field.get_value().trim(); // Get and trim the input value

        });

        // this.item_uom = frappe.ui.form.make_control({
        //     df: {
        //         label: __("UOM"),
        //         fieldtype: "Link",
        //         options: "UOM",
        //         placeholder: __("Select UOM"),
        //         onchange: function () {
        //             me.selected_uom = this.value;
        //             me.filter_items({ uom: me.selected_uom });
        //         },
        //     },
        //     parent: this.$component.find(".item-uoms"),
        //     render_input: true,
        // });

        this.generics = frappe.ui.form.make_control({
            df: {
                label: __("Generics"),
                fieldtype: "Check",
                onchange: () => {
                    // if check it
                    const is_generics = this.generics.get_value();
                    localStorage.setItem('is_generics', is_generics);
                    this.set_search_value("");
                    me.filter_items();
                },
            },
            parent: this.$component.find(".generics"),
            render_input: true,
        });

        // this.item_uom.set_value("PC");
        // this.item_uom.refresh();

        // this.item_uom.toggle_label(false);
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
            // this.load_items_data();
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


        let selectedUOM;
        this.$component.on("click", ".item-wrapper", async function () {
            const $item = $(this);
            me.selectedItem = $item;
            const item_code = unescape($item.attr("data-item-code"));
            const uom = unescape($item.attr("data-uom"));
            const rate = parseFloat(unescape($item.attr("data-rate")));
            const description = unescape($item.attr("data-description"));
            const qty = parseFloat(unescape($item.attr("data-qty")));
            const pos_profile = me.events.get_pos_profile();

            // Debugging logs
            // console.log("Item Clicked:", item_code, uom, rate, description, qty);

            frappe.call({
                method: 'custom_app.customapp.page.packing_list.packing_list.get_item_uom_prices',
                args: {
                    item_code: item_code
                },
                callback: function (response) {
                    if (response.message) {
                        const uomPrices = response.message.uom_prices;
                        // console.log("UOM Prices:", uomPrices);
                        const pricing_rules = response.message.pricing_rules;

                        const uomOptions = Object.keys(uomPrices).filter(uom => uom && uom !== "null").map(uom => ({
                            label: uom,
                            value: uom
                        }));

                        let defaultUOM = uom;
                        if (!uomPrices.hasOwnProperty(defaultUOM)) {
                            defaultUOM = uomOptions.length > 0 ? uomOptions[0].value : null;
                            if (!defaultUOM) {
                                frappe.msgprint(__('No valid UOMs found for this item.'));
                                return;
                            }
                        }

                        const defaultRate = uomPrices[defaultUOM];

                        const dialog = new frappe.ui.Dialog({
                            title: __("Item Details"),
                            fields: [
                                {
                                    fieldtype: "HTML",
                                    title: __("Item Details"),
                                    options: `
                                        <div class="row">
                                            <div class="col-lg">
                                                <div class="form-group">
                                                    <label class="control-label">Item Code</label>
                                                    <input class="form-control" readonly data-fieldname="description" type="text" value="${item_code}"/>
                                                </div>
                                            </div>
                                        </div>
                                    `
                                },
                                {
                                    fieldtype: "HTML",
                                    title: __("Item Details"),
                                    options: `
                                        <div class="row">
                                            <div class="col-lg">
                                                <div class="form-group">
                                                    <label class="control-label">Item Description</label>
                                                    <input class="form-control" readonly data-fieldname="description" type="text" value="${description}"/>
                                                </div>
                                            </div>
                                        </div>
                                    `
                                },
                                {
                                    fieldtype: "HTML",
                                    label: __("Quantity"),
                                    options: `
                                        <div class="row">
                                            <div class="col-lg">
                                                <div class="form-group">
                                                    <label class="control-label">${__("Quantity")}</label>
                                                     <input class="form-control" type="number" data-fieldname="quantity" required value="1" min="1" /> </div>
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
                                    default: defaultUOM
                                },
                                {
                                    fieldtype: "HTML",
                                    label: __("Amount"),
                                    options: `
                                        <div class="row">
                                            <div class="col-lg">
                                                <div class="form-group">
                                                    <label class="control-label">Amount</label>
                                                    <input class="form-control" data-fieldname="total_amount" value="${defaultRate.toFixed(2)}" readonly />
                                                </div>
                                            </div>
                                        </div>
                                    `
                                },

                                {
                                    fieldtype: 'HTML',
                                    label: __("Discounts"),
                                    fieldname: 'item_discount_table_html',
                                    options: renderItemDiscountsTable(pricing_rules, defaultRate)
                                },
                                {
                                    label: 'Branch Item INVTY',
                                    fieldtype: 'Button',
                                    btn_size: 'sm', // xs, sm, lg
                                    click: function () {
                                        // Step 1: Fetch the list of warehouses
                                        let warehouses = [];
                                        // const current_wareouse = // frappe.db.get_value("POS Profile", this.pos_profile, warehouse)
                                        // console.log("Current Warehouse: ", current_wareouse)

                                        frappe.call({
                                            method: "frappe.client.get_list",
                                            args: {
                                                doctype: "Warehouse",
                                                fields: ["name", "warehouse_type", "parent_warehouse"],
                                                limit_page_length: 0 // Fetch all items without limit
                                            },
                                            callback: function (response) {
                                                warehouses = response.message;

                                                // Step 2: Fetch item quantity for each warehouse
                                                let warehouse_data_promises = warehouses.map(warehouse => {
                                                    return new Promise((resolve, reject) => {
                                                        frappe.call({
                                                            method: "custom_app.customapp.page.packing_list.packing_list.get_item_qty_per_warehouse",
                                                            args: {
                                                                warehouse: warehouse.name,
                                                                item_code: item_code // Replace with your item code variable
                                                            },
                                                            callback: function (response) {
                                                                warehouse.actual_qty = response.message;
                                                                resolve(warehouse);
                                                            },
                                                            error: function (error) {
                                                                reject(error);
                                                            }
                                                        });
                                                    });
                                                });

                                                Promise.all(warehouse_data_promises).then(warehouses_with_qty => {
                                                    // Filter out warehouses with zero quantity
                                                    warehouses_with_qty = warehouses_with_qty.filter(warehouse => warehouse.actual_qty > 0);

                                                    const dialog = new frappe.ui.Dialog({
                                                        title: `${item_code} ${description}`,
                                                        fields: [
                                                            {
                                                                fieldtype: 'HTML',
                                                                fieldname: 'warehouse_table_html',
                                                                options: renderWarehousesTable(warehouses_with_qty)
                                                            }
                                                        ],
                                                        primary_action_label: __("Ok"),
                                                        primary_action: function () {
                                                            dialog.hide();
                                                        }
                                                    });

                                                    // Show the dialog and adjust its width
                                                    dialog.show();

                                                    // Adjust dialog width and enable scrolling for the table
                                                    $(dialog.$wrapper).css({
                                                        "max-height": "80vh", // Adjust max height as needed
                                                        "overflow-y": "auto" // Enable vertical scrolling
                                                    });

                                                    // Ensure the table within the dialog is scrollable
                                                    $(dialog.fields_dict.warehouse_table_html.$wrapper).css({
                                                        "max-height": "60vh", // Adjust table max height as needed
                                                        "overflow-y": "auto" // Enable vertical scrolling for the table
                                                    });

                                                }).catch(error => {
                                                    console.error("Error fetching warehouse data:", error);
                                                });

                                                function renderWarehousesTable(data) {
                                                    // Start building the HTML table
                                                    let tableHtml = '<table class="table table-bordered">';
                                                    tableHtml += '<thead><tr>';
                                                    tableHtml += '<th>Name</th>';
                                                    tableHtml += '<th>Quantity</th>';
                                                    tableHtml += '</tr></thead>';
                                                    tableHtml += '<tbody>';

                                                    // Populate table rows with data
                                                    data.forEach(row => {
                                                        tableHtml += '<tr>';
                                                        tableHtml += `<td>${row.name}</td>`;
                                                        tableHtml += `<td>${row.actual_qty}</td>`;
                                                        tableHtml += '</tr>';
                                                    });

                                                    tableHtml += '</tbody>';
                                                    tableHtml += '</table>';

                                                    return tableHtml;
                                                }

                                            }
                                        });
                                    },
                                }

                            ],
                            size: 'large',
                            primary_action_label: __("Ok"),
                            primary_action: function () {
                                const quantity = parseFloat(dialog.wrapper.find('input[data-fieldname="quantity"]').val());
                                const selectedUOM = dialog.wrapper.find('select[data-fieldname="uom"]').val();
                                const totalAmount = parseFloat(dialog.wrapper.find('input[data-fieldname="total_amount"]').val());

                                if (!quantity || quantity <= 0) {
                                    frappe.msgprint(__("Please enter a valid quantity."));
                                    return;
                                }

                                if (!me.selectedItem) {
                                    frappe.msgprint(__("No item selected."));
                                    return;
                                }

                                if (quantity > qty) {
                                    frappe.msgprint(__("Entered Quantity Exceeded"));
                                    return;
                                }

                                frappe.call({
                                    method: 'custom_app.customapp.page.packing_list.packing_list.get_item_uom_conversion',
                                    args: {
                                        item_code: item_code,
                                        uom_code: selectedUOM
                                    },
                                    callback: function (response) {
                                        if (response.message) {
                                            let conversion_factor = response.message;

                                            // Adjust the quantity based on the conversion factor
                                            const converted_quantity = quantity * conversion_factor;

                                            // Check if the converted quantity exceeds the available quantity
                                            if (converted_quantity > qty) {
                                                frappe.msgprint(__("Entered Quantity Exceeded"));
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

                                            dialog.hide();

                                        } else {
                                            frappe.msgprint(__("Failed to fetch UOM conversion factor."));
                                        }
                                    }
                                });
                            }

                        });

                        function renderItemDiscountsTable(data, defaultRate) {

                            // console.log("Pricing Rules: ", data);
                            // console.log("Default UOM: ",  defaultRate);

                            if (!data || data.length === 0) {
                                return '<p>No discounts available for this item.</p>';
                            } else {
                                // Start building the HTML table
                                let tableHtml = '<table class="table">';
                                tableHtml += '<thead><tr>';
                                tableHtml += '<th>Name</th>';
                                tableHtml += '<th>Customer Group</th>';
                                tableHtml += '<th>Percentage</th>';
                                tableHtml += '<th>Amount</th>';
                                tableHtml += '</tr></thead>';
                                tableHtml += '<tbody>';

                                // Populate table rows with data
                                data.forEach(row => {
                                    tableHtml += '<tr>';
                                    tableHtml += `<td>${row.title}</td>`;
                                    tableHtml += `<td>${row.customer_group}</td>`;
                                    tableHtml += `<td>${row.discount_percentage}%</td>`;
                                    let discountedAmount = defaultRate - (defaultRate * (row.discount_percentage / 100));
                                    tableHtml += `<td>${discountedAmount.toFixed(2)}</td>`;
                                    tableHtml += '</tr>';
                                });

                                tableHtml += '</tbody>';
                                tableHtml += '</table>';

                                return tableHtml;

                            }
                        }

                        dialog.on_page_show = function () {
                            setTimeout(() => {
                                const $quantityField = dialog.wrapper.find('input[data-fieldname="quantity"]');
                                $quantityField.focus();
                                $quantityField.select(); // Selects the text inside the field for easy replacement
                            }, 300); // Use a small delay to ensure the element is in the DOM
                        };

                        dialog.show();

                        // Set the default UOM and amount fields
                        dialog.wrapper.find('select[data-fieldname="uom"]').val(defaultUOM);
                        dialog.wrapper.find('input[data-fieldname="total_amount"]').val(defaultRate.toFixed(2));


                        dialog.wrapper.find('input[data-fieldname="quantity"]').on('input', function () {
                            const quantity = parseFloat($(this).val());
                            const selectedUOM = dialog.wrapper.find('select[data-fieldname="uom"]').val();
                            const rate = uomPrices[selectedUOM];
                            if (!isNaN(quantity)) {
                                const totalAmount = (quantity * rate).toFixed(2);
                                dialog.wrapper.find('input[data-fieldname="total_amount"]').val(totalAmount);
                                const discountsTableHtml = renderItemDiscountsTable(response.message.pricing_rules, totalAmount);
                                dialog.fields_dict.item_discount_table_html.$wrapper.html(discountsTableHtml);
                            } else {
                                dialog.wrapper.find('input[data-fieldname="total_amount"]').val(rate.toFixed(2));
                            }
                        });

                        dialog.wrapper.find('select[data-fieldname="uom"]').on('change', function () {
                            const selectedUOM = $(this).val();
                            const rate = uomPrices[selectedUOM];
                            const quantity = parseFloat(dialog.wrapper.find('input[data-fieldname="quantity"]').val());
                            if (!isNaN(quantity)) {
                                const totalAmount = (quantity * rate).toFixed(2);
                                dialog.wrapper.find('input[data-fieldname="total_amount"]').val(totalAmount);
                            } else {
                                dialog.wrapper.find('input[data-fieldname="total_amount"]').val(rate.toFixed(2));
                            }
                            // Update the discounts table with the new rate
                            const discountsTableHtml = renderItemDiscountsTable(response.message.pricing_rules, rate);
                            dialog.fields_dict.item_discount_table_html.$wrapper.html(discountsTableHtml);
                        });

                        dialog.wrapper.find('input[data-fieldname="quantity"]').on('keypress', function (e) {
                            if (e.which === 13) { // Enter key pressed
                                e.preventDefault();
                                dialog.primary_action();
                            }
                        });
                    }
                }
            });
        });

        // this.$component.on("click", ".item-wrapper", function () {
        // 	const $item = $(this);
        // 	const item_code = unescape($item.attr("data-item-code"));
        // 	let batch_no = unescape($item.attr("data-batch-no"));
        // 	let serial_no = unescape($item.attr("data-serial-no"));
        // 	let uom = unescape($item.attr("data-uom"));
        // 	let rate = unescape($item.attr("data-rate"));

        // 	// escape(undefined) returns "undefined" then unescape returns "undefined"
        // 	batch_no = batch_no === "undefined" ? undefined : batch_no;
        // 	serial_no = serial_no === "undefined" ? undefined : serial_no;
        // 	uom = uom === "undefined" ? undefined : uom;
        // 	rate = rate === "undefined" ? undefined : rate;

        // 	me.events.item_selected({
        // 		field: "qty",
        // 		value: "+1",
        // 		item: { item_code, batch_no, serial_no, uom, rate },
        // 	});
        // 	me.search_field.set_focus();
        // });

        // trigger the search when the user types in the search field
        this.search_field.$input.on("input", (e) => {
            clearTimeout(this.last_search);
            const search_term = e.target.value;

            if (search_term.length >= 4) {
            this.last_search = setTimeout(() => {
                this.filter_items({ search_term });
            }, 300);
            } else {
            // this.$items_container.html(""); // Clear the items container if less than 4 characters
            }

            this.$clear_search_btn.toggle(Boolean(this.search_field.$input.val()));
        });

        this.search_field.$input.on("focus", () => {
            this.$clear_search_btn.toggle(Boolean(this.search_field.$input.val()));
        });

        this.$component.on("keydown", (e) => {
            const key = e.which || e.keyCode;
            const isCtrlPressed = e.ctrlKey;
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
                    if (isCtrlPressed) {
                        // Handle Ctrl + Enter as a checkout shortcut
                        break
                    } else {
                        // Regular Enter key behavior
                        e.preventDefault();
                        this.select_highlighted_item();
                    }
                    break;
            }
        });
    }


    attach_shortcuts() {
        const ctrl_label = frappe.utils.is_mac() ? "⌘" : "Ctrl";
        this.search_field.parent.attr("title", `${ctrl_label}+S`);
        frappe.ui.keys.add_shortcut({
            shortcut: "ctrl+s",
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

        document.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                // Add your checkout logic here for Ctrl + Shift + Enter
                console.log("Ctrl + Enter pressed for checkout");
                return false;
            }
        });


        frappe.ui.keys.on("enter", (e) => {

            if (e.ctrlKey) return; // Skip handling if Shift + Enter is pressed

            const selector_is_visible = this.$component.is(":visible");
            const dialog_is_open = document.querySelector(".modal.show");

            if (!selector_is_visible || this.search_field.get_value() === "") return;

            if (this.items.length == 0 && this.barcode_scanned) {
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
                    item: { item_code: itemCode, batch_no: batchNo, serial_no: serialNo, uom: selectedUOM, quantity, rate },
                });

                this.search_field.set_focus();
            }
        });



    }

    // The rest of your class definition...


    item_lookup_per_branch() {
        const dialog = new frappe.ui.Dialog({
            title: "Hello",

            primary_action_label: __("Ok"),
            primary_action: function () {
                dialog.hide();
            }
        })
        dialog.show();
    }


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
        if (this.highlighted_row_index > -1) {
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
        // Ensure no highlight initially
        if (index === -1) {
            this.$items_container.find(".item-wrapper").removeClass("highlight");
            return;
        }

        // Remove highlight from all items
        this.$items_container.find(".item-wrapper").removeClass("highlight");

        // Highlight the item at the current index
        if (index >= 0 && index < this.items.length) {
            this.$items_container.find(".item-wrapper").eq(index).addClass("highlight");
        }
    }

    select_highlighted_item() {
        // Check if a click action is already in progress
        if (this.isClicking) return;

        // Ensure highlighted_row_index is valid
        if (this.highlighted_row_index === -1) {
            // frappe.msgprint({
            //     title: __("No Item Highlighted"),
            //     indicator: "orange",
            //     message: __("Please select an item to highlight before proceeding.")
            // });
            return;
        }

        // Set the isClicking flag to true to indicate that a click action is in progress
        this.isClicking = true;

        // Proceed to select the highlighted item
        const highlightedItem = this.$items_container.find(".item-wrapper").eq(this.highlighted_row_index);
        if (highlightedItem.length) {
            highlightedItem.click(); // Simulate click action
        }

        // Reset the isClicking flag after a short delay to allow for the click action to complete
        setTimeout(() => {
            this.isClicking = false;
        }, 1000); // Adjust the delay (in milliseconds) as needed
    }






    //end here

    filter_items({ search_term = "", uom = "PC" } = {}) {
        if (search_term) {
            search_term = search_term.toLowerCase();

            this.search_index = this.search_index || {};
            if (this.search_index[search_term]) {
                const items = this.search_index[search_term];
                this.items = items;
                if (uom) {
                    this.items = this.items.filter(item => item.uom === uom);
                }
                this.render_item_list(this.items);
                this.auto_add_item && this.items.length == 1 && this.add_filtered_item_to_cart();
                return;
            }
        }

        this.get_items({ search_term }).then(({ message }) => {
            let { items, serial_no, batch_no, barcode } = message;
            if (search_term && !barcode) {
                this.search_index[search_term] = items;
            }

            // Filter by UOM if specified
            if (uom) {
                items = items.filter(item => item.uom === uom);
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
                "grid-column": "span 4 / span 4"
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
