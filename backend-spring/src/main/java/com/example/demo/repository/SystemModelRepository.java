package com.example.demo.repository;

import com.example.demo.entity.ModelStatus;
import com.example.demo.entity.SystemModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SystemModelRepository extends JpaRepository<SystemModel, Long> {

    @Query("select m from SystemModel m where (:keyword is null or :keyword = '' or (m.name like concat('%',:keyword,'%') or m.code like concat('%',:keyword,'%'))) and (:status is null or m.status = :status) and (:scenario is null or :scenario = '' or m.applicableScenarios like concat('%',:scenario,'%'))")
    Page<SystemModel> search(@Param("keyword") String keyword, @Param("status") ModelStatus status, @Param("scenario") String scenario, Pageable pageable);
}


