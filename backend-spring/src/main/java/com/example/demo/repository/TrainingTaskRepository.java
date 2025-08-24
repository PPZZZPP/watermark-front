package com.example.demo.repository;

import com.example.demo.entity.TrainingTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TrainingTaskRepository extends JpaRepository<TrainingTask, Long> {

    @Query("select t from TrainingTask t where (:modelId is null or t.modelId = :modelId) order by t.startTime desc")
    List<TrainingTask> findByModelIdOrderByStart(@Param("modelId") Long modelId);
}


