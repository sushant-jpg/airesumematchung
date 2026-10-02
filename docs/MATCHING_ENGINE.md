# Matching engine

The engine is deterministic and explainable. The same inputs always produce the same score. It does not infer or fabricate absent candidate skills.

## Pipeline

1. Normalize whitespace and canonicalize skill aliases.
2. Deduplicate case-insensitively while retaining canonical display names.
3. Compute required and preferred skill coverage.
4. Cap experience credit at the stated minimum; never give arbitrary bonus points.
5. Compare education text when the job states a requirement.
6. Compute local Jaccard token overlap across resume/profile and job text.
7. Check exact location or remote-work preference compatibility.
8. Apply configured weights and clamp the rounded result to `[0, 100]`.

## Default formula

```text
overall = requiredSkills × .40
        + preferredSkills × .10
        + experience × .20
        + education × .10
        + semanticSimilarity × .15
        + location × .05
```

Weights are validated to total exactly 100. Results contain every component, matched required/preferred skills, missing required skills, experience gap, and four concise reasons.

## Embedding extension

The service contract accepts candidate and job text independently. A future semantic provider can replace token similarity behind `calculate_match` while preserving the public response. Prefer local sentence-transformer embeddings for privacy; make external providers explicit and optional.

## Fairness

Protected traits are not scoring inputs. Education matching should be reviewed for proxy bias, scores must not be used for automatic rejection, and recruiters see the underlying evidence. Monitor outcome distributions and provide a score-appeal/correction path through confirmed profile editing.
