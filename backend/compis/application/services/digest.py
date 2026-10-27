from datetime import timedelta

from compis.application.ports import Clock, Mailer, UnitOfWork

SUBJECT = "¡Nuevas actualizaciones en Compis!"
BODY = (
    "<p>Hola,</p>"
    "<p>Hay novedades en tu vivienda: tareas, gastos o deudas han cambiado "
    "en las últimas 24 horas.</p>"
    "<p>Entra en Compis para revisarlas.</p>"
)


class DigestService:
    def __init__(self, uow: UnitOfWork, clock: Clock, mailer: Mailer) -> None:
        self._uow = uow
        self._clock = clock
        self._mailer = mailer

    def send_daily(self) -> int:
        since = self._clock.now() - timedelta(hours=24)
        home_ids = {activity.home_id for activity in self._uow.activities.list_since(since)}
        sent = 0
        for home_id in sorted(home_ids):
            recipients = [
                roomie.email
                for roomie in self._uow.roomies.list_by_home(home_id)
                if roomie.is_active
            ]
            if recipients:
                self._mailer.send(SUBJECT, BODY, recipients)
                sent += 1
        return sent
