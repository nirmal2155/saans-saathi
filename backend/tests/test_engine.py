import pytest
from app import engine as e


@pytest.mark.parametrize(
    "pm,aqi,band", [(0, 0, 0), (30, 50, 0), (60, 100, 1), (90, 200, 2), (120, 300, 3), (250, 400, 4), (500, 500, 5)]
)
def test_aqi_breakpoints(pm, aqi, band):
    assert e.aqi_from_pm25(pm) == (aqi, band)


def test_aqi_clamps_and_nan():
    assert e.aqi_from_pm25(9999)[0] == 500
    assert e.aqi_from_pm25(-5) == (0, 0)
    assert e.aqi_from_pm25(float("nan")) == (0, 0)


def test_risk_rules():
    assert e.risk_score(30, False, False, 1, 0) == 0
    assert e.risk_score(70, True, False, 5, 4) == 5  # capped
    assert e.risk_score(30, False, True, 1, 2) == 3
    assert e.risk_score(3, False, False, 0, 1) == 2


def test_actions_by_band():
    assert [a["code"] for a in e.actions_for(30, False, False, 0)] == ["normal"]
    codes = [a["code"] for a in e.actions_for(70, True, True, 4)]
    assert {"indoor_exercise", "n95", "reliever", "elder", "pregnant", "medical"} <= set(codes)
    infant = [a["code"] for a in e.actions_for(1, False, False, 4)]
    assert "infant" in infant and "n95" not in infant  # never mask an infant


def test_cadr_and_co2():
    assert e.purifier_cadr(14, 2.7) == 189
    assert e.yearly_co2_kg("cycle", 10, 5) == 0
    assert e.yearly_co2_kg("car", 10, 5) == pytest.approx(800.8)
    assert e.yearly_co2_kg("car", 9999, 99) == pytest.approx(0.154 * 200 * 2 * 7 * 52)
    with pytest.raises(ValueError):
        e.yearly_co2_kg("rocket", 1, 1)
