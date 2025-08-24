package com.example.demo.repository;

import com.example.demo.entity.EvaluationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EvaluationRecordRepository extends JpaRepository<EvaluationRecord, Long> {

    @Query("select e from EvaluationRecord e where (:modelId is null or e.modelId = :modelId) order by e.startTime desc")
    List<EvaluationRecord> findByModelIdOrderByStart(@Param("modelId") Long modelId);
}


