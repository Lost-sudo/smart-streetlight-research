import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy.orm import Session

# Import the module to be tested
from app.core.database import get_db, SessionLocal, engine

def test_get_db_yields_session_and_closes():
    """
    Test that get_db yields a session and ensures it is closed after use.
    """
    with patch("app.core.database.SessionLocal") as mock_session_local:
        mock_session = MagicMock(spec=Session)
        mock_session_local.return_value = mock_session

        db_gen = get_db()
        
        # Get the yielded database session
        db = next(db_gen)
        assert db == mock_session
        
        # Ensure close wasn't called before yielding finishes
        mock_session.close.assert_not_called()
        
        # Trigger the finally block to close the session
        with pytest.raises(StopIteration):
            next(db_gen)
            
        # Ensure close is called exactly once
        mock_session.close.assert_called_once()

def test_database_engine_configuration():
    """
    Verify the engine configuration is set correctly.
    """
    assert getattr(engine, "url", None) is not None
    # engine.url is a sqlalchemy URL object
    assert "postgresql" in engine.url.drivername

def test_session_maker_configuration():
    """
    Verify that the sessionmaker is configured without autocommit/autoflush 
    and is bound to the engine.
    """
    assert SessionLocal.kw.get("autocommit") is False
    assert SessionLocal.kw.get("autoflush") is False
    assert SessionLocal.kw.get("bind") == engine
    assert SessionLocal.kw.get("bind") == engine
