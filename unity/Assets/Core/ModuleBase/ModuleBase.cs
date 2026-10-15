using System.Runtime.InteropServices;
using UnityEngine;

public abstract class ModuleBase : MonoBehaviour
{
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")] private static extern void PhyslabPost(string json);
#else
    private static void PhyslabPost(string json) { Debug.Log("[Physlab] " + json); }
#endif

    // Вызывается сайтом через SendMessage("ModuleRoot", "Init", json)
    public void Init(string json) => OnInit(json);

    protected abstract void OnInit(string json);

    // Отправить событие на сайт. dataJson должен быть валидным JSON.
    protected void Emit(string type, string dataJson = "{}")
    {
        PhyslabPost("{\"type\":\"" + type + "\",\"data\":" + dataJson + "}");
    }
}
