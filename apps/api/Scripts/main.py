import json
import os

def has_object_title_in_test_cases(problem_object):
    """
    Checks if a given problem object contains any test case where the 'title'
    is an object (dict) instead of a string.
    """
    if not isinstance(problem_object, dict):
        return False # Not a valid problem structure to check

    last_version = problem_object.get("lastVersion")
    if not isinstance(last_version, dict):
        return False 
    
    problem_data = last_version.get("data")
    if not isinstance(problem_data, dict):
        return False

    test_cases = problem_data.get("testCases")
    if not isinstance(test_cases, list):
        # If there are no test cases or it's not a list,
        # then it doesn't meet the criteria for having an object title.
        return False

    for test_case in test_cases:
        if not isinstance(test_case, dict):
            # Malformed test case, skip checking its title for this specific filter
            continue 
        
        title = test_case.get("title")
        if isinstance(title, dict):
            # Found a test case where the title is an object
            return True 
            
    return False # No test cases with object titles found

def main_filter_process():
    input_json_file = 'problems.json'
    output_json_file = 'problems_filtered.json'

    if not os.path.exists(input_json_file):
        print(f"Error: Input file '{input_json_file}' was not found in the current directory.")
        print(f"Please make sure the script is in the same directory as '{input_json_file}', or update the path in the script.")
        return

    print(f"Reading data from '{input_json_file}'...")
    try:
        with open(input_json_file, 'r', encoding='utf-8') as f_in:
            all_problems_data = json.load(f_in)
    except json.JSONDecodeError as err:
        print(f"Error: Failed to decode JSON from '{input_json_file}'. Details: {err}")
        return
    except Exception as err:
        print(f"Error: An unexpected error occurred while reading '{input_json_file}'. Details: {err}")
        return

    if not isinstance(all_problems_data, list):
        print(f"Error: Expected the root of '{input_json_file}' to be a list of problems.")
        return

    print("Filtering problems...")
    kept_problems_list = []
    removed_problems_count = 0
    removed_problem_titles_log = []

    original_total_problems = len(all_problems_data)

    for problem_entry in all_problems_data:
        problem_title_for_logging = problem_entry.get("title", "Unknown Title") if isinstance(problem_entry, dict) else "Malformed Problem Entry"
        if has_object_title_in_test_cases(problem_entry):
            removed_problems_count += 1
            removed_problem_titles_log.append(problem_title_for_logging)
            # print(f"Removing problem: '{problem_title_for_logging}' due to object in a test case title.")
        else:
            kept_problems_list.append(problem_entry)
    
    print(f"\nFilter process complete.")
    print(f"Original number of problems: {original_total_problems}")
    print(f"Number of problems removed: {removed_problems_count}")
    print(f"Number of problems remaining: {len(kept_problems_list)}")

    if removed_problems_count > 0:
        print("\nTitles of removed problems (first 10 shown if many):")
        for i, title in enumerate(removed_problem_titles_log):
            if i < 10:
                print(f"  - {title}")
            else:
                print(f"  ... and {len(removed_problem_titles_log) - 10} more.")
                break
    
    try:
        with open(output_json_file, 'w', encoding='utf-8') as f_out:
            json.dump(kept_problems_list, f_out, indent=4) # Using indent=4 for readability
        print(f"\nFiltered data has been written to '{output_json_file}'.")
        print(f"IMPORTANT: Please carefully review '{output_json_file}' before replacing your original '{input_json_file}'.")
    except Exception as err:
        print(f"\nError: Failed to write filtered data to '{output_json_file}'. Details: {err}")

if __name__ == '__main__':
    main_filter_process()