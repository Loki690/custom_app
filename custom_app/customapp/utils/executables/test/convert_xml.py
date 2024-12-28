import frappe
import os
import xml.etree.ElementTree as ET

def test_generate_stock_trans_xml():
    # Setup: Define test parameters
    start_date = "2024-10-01"
    end_date = "2024-10-31"
    
    # Call the server script method
    result = frappe.call(
        "custom_app.customapp.utils.executables.convert_xml.generate_stock_trans_xml",
        start_date=start_date,
        end_date=end_date
    )
    
    # Verify result structure
    assert result["success"], "Failed to generate XML file"
    assert "file_path" in result, "File path missing in result"
    assert os.path.exists(result["file_path"]), "XML file not created"
    
    # Load the generated XML file
    file_path = result["file_path"]
    tree = ET.parse(file_path)
    root = tree.getroot()
    
    # Validate root element
    assert root.tag == "data", "Root element should be 'data'"
    assert "xsi:noNamespaceSchemaLocation" in root.attrib, "Schema location attribute missing"
    assert root.attrib["xsi:noNamespaceSchemaLocation"] == "stock_trans_d.xsd", "Incorrect schema location"

    # Validate version element
    version = root.find("version")
    assert version is not None, "Version element missing"
    assert version.find("software").text == "3.9", "Incorrect software version"
    assert version.find("db").text == "1.6", "Incorrect database version"

    # Validate row elements
    rows = root.findall("row")
    assert len(rows) > 0, "No rows found in the XML file"
    
    for row in rows:
        assert "id" in row.attrib, "Row ID attribute missing"
        assert row.find("coy_code").text == "RDI-R11-DW-0093", "Incorrect 'coy_code'"
        assert row.find("hprodid").text, "Missing 'hprodid' (EDPMS code)"
        assert row.find("brand").text, "Missing 'brand' (Item Name)"
        assert float(row.find("p_sales").text) > 0, "Invalid 'p_sales' value"
        assert row.find("p_purchase").text, "Missing 'p_purchase'"
        assert "T00:00:00" in row.find("tran_date").text, "Incorrect date format in 'tran_date'"
        assert row.find("stock").text == "1", "Stock should be '1'"

    print("Test passed: XML file generated correctly with expected structure.")

    # Clean up: Remove generated file
    os.remove(file_path)
