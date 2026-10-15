using UnityEngine;

[System.Serializable]
public class FrictionConfig
{
    public string surface = "wood";
    public float mass = 2f;
    public bool showGraph = true;
}

// Повесьте на объект сцены с именем ModuleRoot (имя важно)
public class FrictionModule : ModuleBase
{
    FrictionConfig cfg = new FrictionConfig();

    protected override void OnInit(string json)
    {
        if (!string.IsNullOrEmpty(json)) cfg = JsonUtility.FromJson<FrictionConfig>(json);
        Debug.Log($"Surface={cfg.surface}, mass={cfg.mass}");
        // здесь настройте сцену по cfg
        Emit("started");
    }
}
