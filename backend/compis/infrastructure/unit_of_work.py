from compis.infrastructure.db.repositories import (
    SessionLike,
    SqlActivityRepository,
    SqlDebtRepository,
    SqlExpenseRepository,
    SqlFileRepository,
    SqlHomeRepository,
    SqlRoomieRepository,
    SqlShoppingRepository,
    SqlTaskRepository,
)


class SqlUnitOfWork:
    def __init__(self, session: SessionLike) -> None:
        self._session = session
        self.roomies = SqlRoomieRepository(session)
        self.homes = SqlHomeRepository(session)
        self.tasks = SqlTaskRepository(session)
        self.shopping = SqlShoppingRepository(session)
        self.expenses = SqlExpenseRepository(session)
        self.debts = SqlDebtRepository(session)
        self.files = SqlFileRepository(session)
        self.activities = SqlActivityRepository(session)

    def commit(self) -> None:
        self._session.commit()

    def rollback(self) -> None:
        self._session.rollback()
