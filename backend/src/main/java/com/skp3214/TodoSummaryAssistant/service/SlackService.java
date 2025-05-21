package com.skp3214.TodoSummaryAssistant.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.HashMap;
import java.util.Map;

@Service
public class SlackService {

    private final WebClient webClient;
    private final String slackWebhookUrl;

    public SlackService(WebClient.Builder webClientBuilder,
                        @Value("${slack.webhook.url}") String slackWebhookUrl) {
        this.webClient = webClientBuilder.build();
        this.slackWebhookUrl = slackWebhookUrl;
    }

    public Mono<String> sendSummary(String summary) {
        Map<String, String> payload = new HashMap<>();
        payload.put("text", "📝 *Todo Summary*: \n" + summary);

        return webClient.post()
                .uri(slackWebhookUrl)
                .header("Content-Type", "application/json")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(String.class)
                .map(response -> "ok".equalsIgnoreCase(response) ? "Summary sent to Slack successfully!" : "Slack API response: " + response)
                .onErrorResume(error -> {
                    System.err.println("Error sending to Slack: " + error.getMessage());
                    return Mono.just("Failed to send summary to Slack.");
                });
    }
}
