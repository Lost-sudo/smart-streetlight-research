import os
from huggingface_hub import HfApi, login
from app.core.config import settings

class HuggingFaceService:
    def __init__(self):
        self.api = HfApi()
        self.token = settings.HF_TOKEN
        self.dataset_repo = settings.HF_DATASET_REPO
        self.model_repo = settings.HF_MODEL_REPO

    def upload_dataset(self, file_path: str, path_in_repo: str = None, commit_message: str = "Upload dataset snapshot"):
        """
        Uploads a local CSV file to the Hugging Face Dataset Hub.
        """
        if not self.token or not self.dataset_repo:
            print("[hf_service] Skipping upload: HF_TOKEN or HF_DATASET_REPO not configured.")
            return None

        if path_in_repo is None:
            path_in_repo = os.path.basename(file_path)

        try:
            print(f"[hf_service] Uploading {file_path} to {self.dataset_repo}...")
            response = self.api.upload_file(
                path_or_fileobj=file_path,
                path_in_repo=path_in_repo,
                repo_id=self.dataset_repo,
                repo_type="dataset",
                token=self.token,
                commit_message=commit_message
            )
            print(f"[hf_service] Upload successful: {response}")
            return response
        except Exception as e:
            print(f"[hf_service] Upload failed: {str(e)}")
            return None

    def upload_model(self, file_path: str, path_in_repo: str = None, commit_message: str = "Upload trained model"):
        """
        Uploads a trained model file to the Hugging Face Model Hub.
        """
        if not self.token or not self.model_repo:
            print("[hf_service] Skipping upload: HF_TOKEN or HF_MODEL_REPO not configured.")
            return None

        if path_in_repo is None:
            path_in_repo = os.path.basename(file_path)

        try:
            print(f"[hf_service] Uploading {file_path} to {self.model_repo}...")
            response = self.api.upload_file(
                path_or_fileobj=file_path,
                path_in_repo=path_in_repo,
                repo_id=self.model_repo,
                repo_type="model",
                token=self.token,
                commit_message=commit_message
            )
            print(f"[hf_service] Upload successful: {response}")
            return response
        except Exception as e:
            print(f"[hf_service] Upload failed: {str(e)}")
            return None
