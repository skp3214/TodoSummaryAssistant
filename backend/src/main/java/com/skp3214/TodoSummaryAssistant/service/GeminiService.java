package com.skp3214.TodoSummaryAssistant.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GeminiService {

    private final WebClient webClient;
    private final String apiKey;
    private final String modelName;

    public GeminiService(WebClient.Builder webClientBuilder,
                         @Value("${gemini.api.key}") String apiKey,
                         @Value("${gemini.api.url}") String apiUrl,
                         @Value("${gemini.model.name}") String modelName) {
        this.webClient = webClientBuilder.baseUrl(apiUrl).build();
        this.apiKey = apiKey;
        this.modelName = modelName;
    }

    public Mono<String> summarizeTodos(List<String> todoTasks, String systemInstruction) {
        if (todoTasks == null || todoTasks.isEmpty()) {
            return Mono.just("No pending tasks to summarize.");
        }

        String promptText = "summarize the to-do list meaningfully — don’t simulate or mock" +
                "this. Use don't use asteriks to bold it but you can use emojis and tell hey you have these thing pending to do it. \n" +
                todoTasks.stream().map(task -> "- " + task).collect(Collectors.joining("\n"));

        JsonObject requestBody = getJsonObject(systemInstruction, promptText);


        return webClient.post()
                .uri("/v1beta/models/" + modelName + ":generateContent?key=" + apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody.toString())
                .retrieve()
                .bodyToMono(String.class)
                .map(response -> {
                    try {
                        Gson gson = new Gson();
                        JsonObject jsonResponse = gson.fromJson(response, JsonObject.class);
                        return jsonResponse.getAsJsonArray("candidates")
                                .get(0).getAsJsonObject()
                                .getAsJsonObject("content")
                                .getAsJsonArray("parts")
                                .get(0).getAsJsonObject()
                                .get("text").getAsString();
                    } catch (Exception e) {
                        System.err.println("Error parsing Gemini response: " + e.getMessage());
                        System.err.println("Gemini Raw Response on Error: " + response);
                        return "Error: Could not parse summary from LLM response.";
                    }
                })
                .onErrorResume(error -> {
                    System.err.println("Error calling Gemini API: " + error.getMessage());
                    return Mono.just("Error: Failed to get summary from LLM.");
                });
    }

    private static JsonObject getJsonObject(String systemInstruction, String promptText) {
        JsonObject requestBody = new JsonObject();

        if (systemInstruction != null && !systemInstruction.trim().isEmpty()) {
            JsonObject systemInstructionObj = new JsonObject();
            JsonArray systemParts = new JsonArray();
            JsonObject systemTextPart = new JsonObject();
            systemTextPart.addProperty("text", systemInstruction);
            systemParts.add(systemTextPart);
            systemInstructionObj.add("parts", systemParts);
            requestBody.add("systemInstruction", systemInstructionObj);
        }

        JsonObject content = new JsonObject();
        JsonArray parts = new JsonArray();
        JsonObject textPart = new JsonObject();
        textPart.addProperty("text", promptText);
        parts.add(textPart);
        content.add("parts", parts);

        JsonArray contents = new JsonArray();
        contents.add(content);
        requestBody.add("contents", contents);
        return requestBody;
    }
}
