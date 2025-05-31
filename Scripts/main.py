import json
from langdetect import detect, LangDetectException

def is_english(text):
    """
    Checks if the given text is English.
    Returns True if English or if text is empty/None.
    Returns False if non-English or if language detection fails.
    """
    if not text or not text.strip():
        return True  # Treat empty or whitespace-only strings as not triggering non-English removal
    try:
        # Explicitly check for placeholder content that is technically English but might be undesired
        if text.lower() == "no statement (reverse)": # This specific string is English
            return True
        return detect(text) == 'en'
    except LangDetectException:
        # If language detection fails (e.g., text is too short or ambiguous),
        # we'll assume it's non-English for the purpose of cleaning.
        # You can change this behavior if you prefer to keep such entries.
        print(f"Warning: Language detection failed for text: \"{text[:100]}...\" (assuming non-English)")
        return False
    except Exception as e:
        print(f"An unexpected error occurred during language detection for text: \"{text[:100]}...\": {e}")
        return False


def clean_json_problems(input_filepath="problems.json", output_filepath="cleaned_problems.json"):
    """
    Loads problems from a JSON file, filters them, and saves to a new JSON file.
    """
    try:
        with open(input_filepath, 'r', encoding='utf-8') as f:
            problems_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: The file {input_filepath} was not found.")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {input_filepath}. Please ensure it's a valid JSON file.")
        return
    except Exception as e:
        print(f"An unexpected error occurred while reading {input_filepath}: {e}")
        return

    if not isinstance(problems_data, list):
        print("Error: Expected the JSON file to contain a list of problems.")
        # If your JSON is a dictionary with a key holding the list, adjust accordingly, e.g.:
        # problems_list = problems_data.get("your_list_key_name")
        # if not isinstance(problems_list, list):
        #     print("Error: Could not find a list of problems under the expected key.")
        #     return
        # problems_data = problems_list
        return


    cleaned_problems = []
    removed_count_reverse = 0
    removed_count_language = 0
    error_count = 0

    print(f"Starting processing of {len(problems_data)} problems...")

    for i, problem in enumerate(problems_data):
        if not isinstance(problem, dict):
            print(f"Warning: Skipping item at index {i} as it is not a dictionary: {problem}")
            error_count += 1
            continue

        try:
            title = problem.get("title", "")
            last_version = problem.get("lastVersion")
            if not isinstance(last_version, dict):
                print(f"Warning: Skipping problem '{title}' due to missing or invalid 'lastVersion'.")
                error_count += 1
                continue

            data = last_version.get("data")
            if not isinstance(data, dict):
                print(f"Warning: Skipping problem '{title}' due to missing or invalid 'lastVersion.data'.")
                error_count += 1
                continue

            input_desc = data.get("inputDescription", "")
            output_desc = data.get("outputDescription", "")
            statement = data.get("statement", "")

            # Condition 1: Check for "reverse" descriptions
            is_reverse_entry = (input_desc == "no input description (reverse)" and
                                output_desc == "no output description (reverse)")

            if is_reverse_entry:
                removed_count_reverse += 1
                # print(f"Removing problem (reverse descriptions): '{title}'")
                continue

            # Condition 2: Check for non-English title or statement
            # Only check language if it's not a "reverse" entry targeted for removal
            title_is_english = is_english(title)
            # We keep "no statement (reverse)" if the title and descriptions are otherwise fine
            statement_is_english = True # Default to true
            if statement.lower() != "no statement (reverse)": # Only check actual statements for language
                 statement_is_english = is_english(statement)


            if not title_is_english:
                removed_count_language += 1
                # print(f"Removing problem (non-English title): '{title}'")
                continue

            if not statement_is_english:
                removed_count_language += 1
                # print(f"Removing problem (non-English statement): '{title}' - Statement: '{statement[:50]}...'")
                continue

            cleaned_problems.append(problem)

        except Exception as e:
            error_count += 1
            problem_title = problem.get('title', f'Unknown Title at index {i}')
            print(f"Error processing problem '{problem_title}': {e}")
            # Optionally, decide whether to keep or discard entries that cause errors

    print(f"\nProcessing complete.")
    print(f"Original number of problems: {len(problems_data)}")
    print(f"Number of problems removed due to '(reverse)' descriptions: {removed_count_reverse}")
    print(f"Number of problems removed due to non-English content: {removed_count_language}")
    print(f"Number of problems skipped due to errors or invalid format: {error_count}")
    print(f"Number of problems remaining: {len(cleaned_problems)}")

    try:
        with open(output_filepath, 'w', encoding='utf-8') as f:
            json.dump(cleaned_problems, f, indent=4, ensure_ascii=False)
        print(f"\nSuccessfully saved cleaned problems to {output_filepath}")
    except Exception as e:
        print(f"An unexpected error occurred while writing {output_filepath}: {e}")

if __name__ == "__main__":
    # Adjust filepaths if your JSON file is named differently or in another directory
    clean_json_problems(input_filepath="problems.json", output_filepath="cleaned_problems.json")