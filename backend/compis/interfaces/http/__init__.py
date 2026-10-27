from flask import Flask

from compis.interfaces.http import (
    activity,
    auth,
    calendar,
    errors,
    files,
    finance,
    homes,
    roomies,
    shopping,
    system,
    tasks,
)

BLUEPRINTS = (
    auth.bp,
    roomies.bp,
    homes.bp,
    tasks.bp,
    shopping.bp,
    finance.bp,
    files.bp,
    activity.bp,
    calendar.bp,
    system.bp,
)


def register_http(app: Flask) -> None:
    for blueprint in BLUEPRINTS:
        app.register_blueprint(blueprint, url_prefix="/api")
    errors.register(app)
