package com.laststats.auth.repository;

import com.laststats.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

// JpaRepository gives us .save(), .findById(), .findAll() for FREE
// We only need to declare the EXTRA queries we want
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
