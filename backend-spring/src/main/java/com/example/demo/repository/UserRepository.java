package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    @Query("select u from User u where (:kw is null or :kw = '' or u.username like concat('%',:kw,'%') or u.nickname like concat('%',:kw,'%') or u.email like concat('%',:kw,'%') or u.phone like concat('%',:kw,'%')) and (:role is null or :role = '' or u.role = :role)")
    Page<User> search(@Param("kw") String keyword, @Param("role") String role, Pageable pageable);
}


