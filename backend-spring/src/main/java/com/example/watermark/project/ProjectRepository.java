package com.example.watermark.project;

import com.example.watermark.domain.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("select p from Project p where (:name is null or :name = '' or p.name like concat('%',:name,'%')) and (:status is null or p.status = :status)")
    Page<Project> search(@Param("name") String name, @Param("status") ProjectStatus status, Pageable pageable);
}


