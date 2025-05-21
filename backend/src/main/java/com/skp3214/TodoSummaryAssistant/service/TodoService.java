package com.skp3214.TodoSummaryAssistant.service;

import com.skp3214.TodoSummaryAssistant.model.Todo;
import com.skp3214.TodoSummaryAssistant.repository.TodoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TodoService {

    @Autowired
    private TodoRepository todoRepository;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private SlackService slackService;

    public List<Todo> getAllTodos() {
        return todoRepository.findAll();
    }

    public Todo addTodo(Todo todo) {
        return todoRepository.save(todo);
    }

    public Optional<Todo> getTodoById(Long id) {
        return todoRepository.findById(id);
    }

    public Todo updateTodo(Long id, Todo todoDetails) {
        Todo todo = todoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Todo not found with id: " + id));
        todo.setTask(todoDetails.getTask());
        todo.setCompleted(todoDetails.isCompleted());
        return todoRepository.save(todo);
    }

    public void deleteTodo(Long id) {
        if (!todoRepository.existsById(id)) {
            throw new RuntimeException("Todo not found with id: " + id);
        }
        todoRepository.deleteById(id);
    }

    public List<Todo> getPendingTodos() {
        return todoRepository.findByCompletedFalse();
    }

    public Mono<String> summarizeAndSendTodos() {
        List<Todo> pendingTodos = getPendingTodos();
        if (pendingTodos.isEmpty()) {
            return Mono.just("No pending todos to summarize.");
        }
        List<String> tasks = pendingTodos.stream().map(Todo::getTask).collect(Collectors.toList());

        String systemInstruction = "You are a helpful assistant that summarizes to-do lists concisely.";

        return geminiService.summarizeTodos(tasks, systemInstruction)
                .flatMap(summary -> {
                    if (summary != null && !summary.startsWith("Error:")) {
                        return slackService.sendSummary(summary);
                    } else {
                        return Mono.just(summary != null ? summary : "Failed to generate summary.");
                    }
                })
                .onErrorResume(error -> {
                    System.err.println("Error in summarizeAndSendTodos: " + error.getMessage());
                    return Mono.just("An error occurred during the summarization or Slack notification process.");
                });
    }
}
