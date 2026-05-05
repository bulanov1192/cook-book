import type { Request, Response } from "express";
import { clearRecipeVoteEntry, getRecipeVoteSummary, setRecipeVoteEntry } from "./recipe-vote.service.js";
import { recipeVoteParamsSchema, setRecipeVoteSchema } from "./recipe-vote.schemas.js";

export async function getRecipeVoteHandler(request: Request, response: Response) {
  const { id } = recipeVoteParamsSchema.parse(request.params);
  response.json(await getRecipeVoteSummary(id, request.auth));
}

export async function setRecipeVoteHandler(request: Request, response: Response) {
  const { id } = recipeVoteParamsSchema.parse(request.params);
  const { value } = setRecipeVoteSchema.parse(request.body);
  response.json(await setRecipeVoteEntry(id, value, request.auth));
}

export async function clearRecipeVoteHandler(request: Request, response: Response) {
  const { id } = recipeVoteParamsSchema.parse(request.params);
  response.json(await clearRecipeVoteEntry(id, request.auth));
}
