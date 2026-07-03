import pandas as pd
import sys
import json

def read_excel(file_path):
    try:
        xls = pd.ExcelFile(file_path)
        fails = []
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet_name)
            # Find rows where any column contains 'FAIL'
            # Convert all to string to safely search
            df_str = df.astype(str)
            fail_rows = df[df_str.apply(lambda row: row.astype(str).str.contains('FAIL', case=False).any(), axis=1)]
            
            if not fail_rows.empty:
                for idx, row in fail_rows.iterrows():
                    fails.append({
                        "Sheet": sheet_name,
                        "Row": idx + 2,
                        "Data": row.dropna().to_dict()
                    })
        
        with open("fails.json", "w", encoding="utf-8") as f:
            json.dump(fails, f, ensure_ascii=False, indent=2)
            
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        read_excel(sys.argv[1])
    else:
        print("Please provide the file path.")
