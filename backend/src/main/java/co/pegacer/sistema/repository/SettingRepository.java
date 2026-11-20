package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.Setting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettingRepository extends JpaRepository<Setting, String> {
}
