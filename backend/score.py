# from fastapi import FastAPI
# from pydantic import BaseModel
# from typing import List, Dict
# import numpy as np
# from sentence_transformers import SentenceTransformer
# from sklearn.metrics.pairwise import cosine_similarity

# class JobDescription(BaseModel):
#     jd_id: str
#     jd_skills: List[str]


# class RecommendationRequest(BaseModel):
#     resume_skills: List[str]
#     job_descriptions: List[JobDescription]

# class JobScore(BaseModel):
#     jd_id: str
#     score: float

# class AsymmetricSkillRecommender:
#     """
#     Calculates internship compatibility using an asymmetric scoring model that
#     heavily penalizes unmet job requirements.
#     """
#     def __init__(self, model_name='all-MiniLM-L6-v2'):
#         try:
#             self.model = SentenceTransformer(model_name)
#             print(f"Model '{model_name}' loaded successfully.")
#         except Exception as e:
#             print(f"Error loading model: {e}")
#             self.model = None

#     def _get_embeddings(self, skills):
#         if not self.model:
#             raise ValueError("Model is not loaded.")
#         return self.model.encode(skills)

#     def calculate_compatibility_score(self, candidate_skills, job_skills, coverage_weight=0.7, non_linearity_power=1):
#         if not self.model or not candidate_skills or not job_skills:
#             return {
#                 'candidate_coverage_score': 0,
#                 'job_relevance_score': 0,
#                 'linear_weighted_score': 0,
#                 'final_compatibility_score': 0
#             }

#         candidate_embeddings = self._get_embeddings(candidate_skills)
#         job_embeddings = self._get_embeddings(job_skills)
#         similarity_matrix = cosine_similarity(candidate_embeddings, job_embeddings)
#         similarity_matrix = np.clip(similarity_matrix, 0, 1)

#         best_match_for_each_job_skill = np.max(similarity_matrix, axis=0)

#         # Geometric Mean
#         epsilon = 1e-9
#         candidate_coverage_score = np.prod(best_match_for_each_job_skill + epsilon) ** (1.0 / len(best_match_for_each_job_skill))

#         best_match_for_each_candidate_skill = np.max(similarity_matrix, axis=1)
#         job_relevance_score = np.mean(best_match_for_each_candidate_skill)

#         linear_final_score = (candidate_coverage_score * coverage_weight) + \
#                              (job_relevance_score * (1 - coverage_weight))

#         if non_linearity_power != 1.0:
#             final_score = np.power(linear_final_score, non_linearity_power)
#         else:
#             final_score = linear_final_score

#         return {
#             'candidate_coverage_score': round(float(candidate_coverage_score), 4),
#             'job_relevance_score': round(float(job_relevance_score), 4),
#             'linear_weighted_score': round(float(linear_final_score), 4),
#             'final_compatibility_score': round(float(final_score), 4)
#         }


# app = FastAPI()

# recommender = AsymmetricSkillRecommender()

# @app.post("/recommend")
# async def recommend_jobs(request: RecommendationRequest) -> List[JobScore]:
#     """
#     Input: resume_skills (list), job_descriptions (list of {jd_id, jd_skills})
#     Output: List of {jd_id, score} sorted by score descending
#     """
#     results = []
    
#     for jd in request.job_descriptions:
#         score_details = recommender.calculate_compatibility_score(
#             candidate_skills=request.resume_skills,
#             job_skills=jd.jd_skills
#         )
        
#         results.append(JobScore(
#             jd_id=jd.jd_id,
#             score=score_details['final_compatibility_score']
#         ))
    
#     results.sort(key=lambda x: x.score, reverse=True)
    
#     return results


# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)


from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


class JobDescription(BaseModel):
    jd_id: str
    jd_skills: List[str]


class RecommendationRequest(BaseModel):
    resume_skills: List[str]
    job_descriptions: List[JobDescription]


class JobScore(BaseModel):
    jd_id: str
    score: float
    skill_scores: Dict[str, float]  # new: per-skill match scores


class AsymmetricSkillRecommender:
    """
    Calculates internship compatibility using an asymmetric scoring model that
    heavily penalizes unmet job requirements.
    """
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        try:
            self.model = SentenceTransformer(model_name)
            print(f"Model '{model_name}' loaded successfully.")
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None

    def _get_embeddings(self, skills):
        if not self.model:
            raise ValueError("Model is not loaded.")
        return self.model.encode(skills)

    def calculate_compatibility_score(self, candidate_skills, job_skills,
                                      coverage_weight=0.7, non_linearity_power=1):
        if not self.model or not candidate_skills or not job_skills:
            return {
                'candidate_coverage_score': 0,
                'job_relevance_score': 0,
                'linear_weighted_score': 0,
                'final_compatibility_score': 0,
                'jd_skill_scores': {}
            }

        candidate_embeddings = self._get_embeddings(candidate_skills)
        job_embeddings = self._get_embeddings(job_skills)
        similarity_matrix = cosine_similarity(candidate_embeddings, job_embeddings)
        similarity_matrix = np.clip(similarity_matrix, 0, 1)

        # Best match per JD skill (columns)
        best_match_for_each_job_skill = np.max(similarity_matrix, axis=0)

        # Geometric Mean for coverage
        epsilon = 1e-9
        candidate_coverage_score = np.prod(best_match_for_each_job_skill + epsilon) ** (
            1.0 / len(best_match_for_each_job_skill)
        )

        # Best match per candidate skill (rows)
        best_match_for_each_candidate_skill = np.max(similarity_matrix, axis=1)
        job_relevance_score = np.mean(best_match_for_each_candidate_skill)

        linear_final_score = (candidate_coverage_score * coverage_weight) + \
                             (job_relevance_score * (1 - coverage_weight))

        if non_linearity_power != 1.0:
            final_score = np.power(linear_final_score, non_linearity_power)
        else:
            final_score = linear_final_score

        # Build skill-level breakdown
        jd_skill_scores = {
            skill: int(score >= 0.6)
            for skill, score in zip(job_skills, best_match_for_each_job_skill)
        }

        # scale final score by sqrt(3.3) as requested
        scaled_final = float(final_score) * float(np.sqrt(3.3))

        # If the scaled score is 100 or more, cap it at 96 per requirement
        if scaled_final >= 100.0:
            scaled_final = 98.0

        return {
            'candidate_coverage_score': round(float(candidate_coverage_score), 4),
            'job_relevance_score': round(float(job_relevance_score), 4),
            'linear_weighted_score': round(float(linear_final_score), 4),
            'final_compatibility_score': round(scaled_final, 4),
            'jd_skill_scores': jd_skill_scores
        }


app = FastAPI()
recommender = AsymmetricSkillRecommender()


@app.post("/recommend")
async def recommend_jobs(request: RecommendationRequest) -> List[JobScore]:
    """
    Input: resume_skills (list), job_descriptions (list of {jd_id, jd_skills})
    Output: List of {jd_id, score, skill_scores} sorted by score descending
    """
    results = []
    for jd in request.job_descriptions:
        score_details = recommender.calculate_compatibility_score(
            candidate_skills=request.resume_skills,
            job_skills=jd.jd_skills
        )
        results.append(JobScore(
            jd_id=jd.jd_id,
            score=score_details['final_compatibility_score'],
            skill_scores=score_details['jd_skill_scores']
        ))

    results.sort(key=lambda x: x.score, reverse=True)
    return results


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
