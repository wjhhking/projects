import os
import json
import sys
from datasets import load_dataset

def download_mmlu_dataset():
    """
    Downloads the MMLU dataset from cais/mmlu and saves it to the
    project's data directory.
    """
    # --- Configuration ---
    dataset_name = "mmlu"
    huggingface_id = "cais/mmlu"
    huggingface_config = "all"
    # ---------------------

    print(f"--- Starting download for {dataset_name} ---")

    # Construct absolute path to the data directory from the project root (games/)
    project_root = os.getcwd()
    data_dir = os.path.join(project_root, "learner", "data", dataset_name)
    os.makedirs(data_dir, exist_ok=True)
    print(f"Data will be saved in: {data_dir}")

    # Load the MMLU dataset
    try:
        mmlu_dataset = load_dataset(huggingface_id, huggingface_config)
    except Exception as e:
        print(f"Error loading dataset {huggingface_id}: {e}", file=sys.stderr)
        return

    # Print info about the dataset
    print(f"\n'{dataset_name}' dataset loaded with the following splits: {mmlu_dataset.keys()}")
    for split in mmlu_dataset:
        print(f"Split '{split}' contains {len(mmlu_dataset[split])} examples")

        # Save each split to the data directory
        output_path = os.path.join(data_dir, f"mmlu_{split}.json")
        mmlu_dataset[split].to_json(output_path)
        print(f"Saved {split} split to {output_path}")

        # Print the first example
        if len(mmlu_dataset[split]) > 0:
            print(f"First example from '{split}' split:")
            print(mmlu_dataset[split][0])
        print("-" * 50)

    # Also save a metadata file with information about the subjects
    subjects = set()
    for split in mmlu_dataset:
        if "subject" in mmlu_dataset[split].features:
            subjects.update(set(mmlu_dataset[split]["subject"]))

    metadata = {
        "huggingface_id": huggingface_id,
        "huggingface_config": huggingface_config,
        "splits": {split: len(mmlu_dataset[split]) for split in mmlu_dataset},
        "subjects": sorted(list(subjects)) if subjects else "No subject field found"
    }
    metadata_path = os.path.join(data_dir, "metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"\nMetadata saved to {metadata_path}")


    print(f"\n--- {dataset_name} download completed successfully! ---")

if __name__ == "__main__":
    download_mmlu_dataset() 