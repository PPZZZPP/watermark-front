package com.example.watermark.compliance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ComplianceRecordRepository extends JpaRepository<ComplianceRecord, Long> {
    @Query("select c from ComplianceRecord c where (:projectId is null or c.projectId = :projectId) and (:userId is null or c.userId = :userId) and (:operation is null or :operation = '' or c.operation = :operation)")
    Page<ComplianceRecord> search(@Param("projectId") Long projectId,
                                  @Param("userId") Long userId,
                                  @Param("operation") String operation,
                                  Pageable pageable);
}


