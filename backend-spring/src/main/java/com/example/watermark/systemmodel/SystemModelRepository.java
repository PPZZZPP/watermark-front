package com.example.watermark.systemmodel;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SystemModelRepository extends JpaRepository<SystemModel, Long> {

    @Query("select m from SystemModel m where (:keyword is null or :keyword = '' or (m.name like concat('%',:keyword,'%') or m.code like concat('%',:keyword,'%'))) and (:status is null or m.status = :status)")
    Page<SystemModel> search(@Param("keyword") String keyword, @Param("status") ModelStatus status, Pageable pageable);
}


