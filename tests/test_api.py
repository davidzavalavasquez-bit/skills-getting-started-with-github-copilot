from fastapi.testclient import TestClient
import pytest

from src.app import app, activities


@pytest.fixture(autouse=True)
def reset_activities():
    # Make a shallow copy of participants and restore after test
    original = {k: v["participants"][:] for k, v in activities.items()}
    yield
    for k, lst in original.items():
        activities[k]["participants"] = lst[:]


def test_get_activities():
    client = TestClient(app)
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert "Chess Club" in data


def test_signup_and_unregister_participant():
    client = TestClient(app)
    activity = "Chess Club"
    email = "test.user@mergington.edu"

    # Ensure not present
    assert email not in activities[activity]["participants"]

    # Signup via POST
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert email in activities[activity]["participants"]

    # Unregister via DELETE
    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 200
    assert email not in activities[activity]["participants"]


def test_unregister_nonexistent_participant():
    client = TestClient(app)
    activity = "Programming Class"
    email = "no.such@mergington.edu"

    # Ensure email not present
    assert email not in activities[activity]["participants"]

    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 404
