from app.services.display_utils import display_text, nice_class_label


def test_display_text_replaces_placeholders() -> None:
    assert display_text("????", "品牌信息待补充") == "品牌信息待补充"
    assert display_text("  墨兰奶白  ", "品牌信息待补充") == "墨兰奶白"


def test_nice_class_label_preserves_valid_category() -> None:
    assert nice_class_label("第43类-餐饮服务") == "第43类-餐饮服务"
    assert nice_class_label("????", "类别待补充") == "类别待补充"
