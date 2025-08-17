package com.example.watermark.video;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VideoRepository extends JpaRepository<Video, Long> {

    @Query("select v from Video v where (:projectId is null or v.projectId = :projectId) and (:status is null or :status = '' or v.status = com.example.watermark.video.VideoStatus.valueOf(:status)) and (:filename is null or :filename = '' or v.filename like concat('%',:filename,'%'))")
    Page<Video> search(@Param("projectId") Long projectId,
                       @Param("status") String status,
                       @Param("filename") String filename,
                       Pageable pageable);
}


