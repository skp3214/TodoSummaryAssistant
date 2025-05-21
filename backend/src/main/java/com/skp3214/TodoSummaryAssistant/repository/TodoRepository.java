package com.skp3214.TodoSummaryAssistant.repository;


import com.skp3214.TodoSummaryAssistant.model.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TodoRepository extends JpaRepository<Todo, Long> {
    List<Todo> findByCompletedFalse();
}
