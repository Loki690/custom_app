import frappe
import json

@frappe.whitelist()
def check_item_duplicates(items, apply_on, price_or_product, selling, customer_group, discount_percentage, exclude_rule=None):
    """
    Check for duplicate items in Pricing Rule with the same criteria.

    :param items: List (or string representation of a list) of item codes to check
    :param apply_on: The 'Apply On' field value (e.g., "Item Code", "Item Group")
    :param price_or_product: The 'Price or Product Discount' field value
    :param selling: Whether it's a Selling rule (1 for Selling, 0 for Buying)
    :param customer_group: Customer Group for the rule
    :param discount_percentage: Discount percentage being applied
    :param exclude_rule: (Optional) Pricing Rule name to exclude from check (for updates)
    :return: List of duplicate rules and items, or "wala pa" if none found
    """

    # Ensure items is a proper list
    if isinstance(items, str):
        try:
            items = json.loads(items)  # Convert JSON string to Python list
        except json.JSONDecodeError:
            # If it fails to parse as JSON, treat it as a single item code
            items = [items]

    

    #  Build filters for Pricing Rule
    conditions = [
        ["apply_on", "=", apply_on],
        ["price_or_product_discount", "=", price_or_product],
        ["selling", "=", selling],
        ["customer_group", "=", customer_group],
        ["discount_percentage", "=", discount_percentage]
    ]

    # Exclude current rule if updating
    if exclude_rule:
        conditions.append(["name", "!=", exclude_rule])

    

    # Fetch all Pricing Rules that match the conditions
    duplicate_rules = frappe.get_all(
        "Pricing Rule",
        filters=conditions,
        fields=["name"]
    )

    if not duplicate_rules:
       
        return "wala pa"

    # Convert the list of dicts to a list of names
    duplicate_rule_names = [rule["name"] for rule in duplicate_rules]

    
    # Check if any of these rules contain the same items in 'Pricing Rule Item Code'
    if duplicate_rule_names and items:
        # Prepare placeholders for parameterized query
        rule_placeholders = ", ".join(["%s"] * len(duplicate_rule_names))
        item_placeholders = ", ".join(["%s"] * len(items))

        sql_query = f"""
            SELECT parent, item_code
            FROM `tabPricing Rule Item Code`
            WHERE parent IN ({rule_placeholders})
            AND item_code IN ({item_placeholders})
        """

        # Combine rule names and items for the parameter tuple
        parameter_tuple = tuple(duplicate_rule_names + items)

        # 5. Execute the parameterized SQL query
        matching_rules = frappe.db.sql(sql_query, parameter_tuple, as_dict=True)
        
        return matching_rules if matching_rules else "wala pa"

   
    return "wala pa"
